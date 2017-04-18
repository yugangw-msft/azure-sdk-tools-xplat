#include "stdafx.h"
#include "dispatch_command.h"

static wchar_t valid_hex_chars[] = L"0123456789ABCDEFabcdef";

int validate_password_blob(wchar_t *password);
void set_credential_blob(PCREDENTIAL credential, wchar_t *blob_as_hex_string);
size_t max_target_length(command_parameters_t *parameters);

//
// Add a credential to the credential store
//
int add_credential(command_parameters_t *parameters)
{
    if (parameters->use_filter) 
    {
        fwprintf(stderr, L"Cannot use -g switch when adding credential\n");
        return 1;
    }

    int is_valid = validate_password_blob(parameters->credential_blob_as_hex_string);
    if (is_valid != 0)
    {
        return is_valid;
    }

    set_default_credential_type(parameters);

    if (wcslen(parameters->credential_target_name) > max_target_length(parameters))
    {
        fwprintf(stderr, L"Target type is too long, target is %d bytes, max is %d\n",
            wcslen(parameters->credential_target_name), max_target_length(parameters));
        return 1;
    }


    int err = 0;
    CREDENTIAL new_credential;

    memset(&new_credential, 0, sizeof(new_credential));
    new_credential.Type = parameters->credential_type;
    new_credential.TargetName = parameters->credential_target_name;
    new_credential.UserName = L"creds.exe";
    new_credential.Persist = CRED_PERSIST_LOCAL_MACHINE;
    set_credential_blob(&new_credential, parameters->credential_blob_as_hex_string);
    
    if (new_credential.CredentialBlobSize > CRED_MAX_CREDENTIAL_BLOB_SIZE)
    {
        fwprintf(stderr, L"Password is too long, must be no more than %d bytes\n", CRED_MAX_CREDENTIAL_BLOB_SIZE);
        err = 1;
        goto DONE;
    }
    if (!CredWrite(&new_credential, 0))
    {
        err = GetLastError();
        fwprintf(stderr, L"Error writing to credential store, error code 0x%x\n", err);
    }
    
DONE:
    free(new_credential.CredentialBlob);
    return err;
}

static int validate_password_blob(wchar_t *password)
{
    if (password == NULL)
    {
        fwprintf(stderr, L"Must specify password using -p switch\n");
        return 1;
    }

    size_t password_length = wcslen(password);
    for (size_t i = 0; i < password_length; ++i)
    {
        if (wcschr(valid_hex_chars, password[i]) == NULL)
        {
            fwprintf(stderr, L"Illegal character %c found in password. Password must be hex encoded including only %s characters\n",
                password[i], valid_hex_chars);
            return 1;
        }
    }
    return 0;
}

static int char_to_hex_value(wchar_t ch)
{
    if (ch >= L'0' && ch <= L'9')
    {
        return ch - L'0';
    }

    if (ch >= L'a' && ch <= L'f')
    {
        return (ch - L'a') + 0xa;
    }

    if (ch >= L'A' && ch <= L'F')
    {
        return (ch - L'A') + 0xa;
    }
    // Will never get here, previous validation
    // ensures that ch will always be in one of
    // the ranges above. But have to return
    // something to keep compiler happy.
    return -1;
}

void set_credential_blob(PCREDENTIAL credential, wchar_t *blob_as_hex_string)
{
    size_t input_string_length_in_chars = wcslen(blob_as_hex_string);
    size_t blob_length_in_bytes = input_string_length_in_chars / 2; // two chars per byte
    unsigned char *blob_buffer = malloc(blob_length_in_bytes);

    wchar_t *end = blob_as_hex_string + input_string_length_in_chars;
    unsigned char *out = blob_buffer;
    for (wchar_t *in = blob_as_hex_string; in < end; in += 2)
    {
        unsigned char byte = (char_to_hex_value(*in) << 4) | char_to_hex_value(*(in + 1));
        *out++ = byte;
    }

    credential->CredentialBlobSize = blob_length_in_bytes;
    credential->CredentialBlob = blob_buffer;
}

static size_t max_target_length(command_parameters_t *parameters)
{
    if (parameters->credential_type == CRED_TYPE_GENERIC)
    {
        return CRED_MAX_GENERIC_TARGET_NAME_LENGTH;
    }

    return CRED_MAX_DOMAIN_TARGET_NAME_LENGTH;
}