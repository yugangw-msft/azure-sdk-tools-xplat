#include "stdafx.h"
#include "print_credential.h"
#include "credential_types.h"

wchar_t *get_credential_data(PCREDENTIAL credential, wchar_t *output_buffer, DWORD output_buffer_length_in_chars);

#define FORMATTED_BUFFER_SIZE_CHARS (CRED_MAX_CREDENTIAL_BLOB_SIZE * 2 + 1)

int print_credential(PCREDENTIAL credential, BOOL include_password) 
{
    wchar_t formatted_credential[FORMATTED_BUFFER_SIZE_CHARS];
    if (include_password)
    {
        memset(formatted_credential, 0, sizeof(formatted_credential));
        if (get_credential_data(credential, formatted_credential, FORMATTED_BUFFER_SIZE_CHARS) == NULL)
        {
            return 1;
        }
    }

    wprintf(L"Target Name: %s\n", credential->TargetName);
    wprintf(L"Type: %s\n", credential_type_to_string(credential->Type));
    wprintf(L"User Name: %s\n", credential->UserName);
    if (include_password)
    {
        wprintf(L"Credential: %s\n", formatted_credential);
    }
    wprintf(L"\n");

    return 0;
}

int print_credential_no_secret(PCREDENTIAL credential)
{
    return print_credential(credential, FALSE);
}

int print_credential_with_secret(PCREDENTIAL credential)
{
    return print_credential(credential, TRUE);
}

static wchar_t hexDigits[] = L"0123456789abcdef";
static wchar_t *get_credential_data(PCREDENTIAL credential, wchar_t *output_buffer, DWORD output_buffer_length_in_chars)
{
    if (output_buffer_length_in_chars < credential->CredentialBlobSize * 2)
    {
        fwprintf(stderr, L"Buffer size %d is too small for credential, credential is %d bytes\n", output_buffer_length_in_chars, credential->CredentialBlobSize);
        return NULL;
    }

    wchar_t *output_char = output_buffer;
    for (LPBYTE input_byte = credential->CredentialBlob; input_byte < credential->CredentialBlob + credential->CredentialBlobSize; ++input_byte)
    {
        *(output_char++) = hexDigits[((*input_byte) >> 4) & 0xf];
        *(output_char++) = hexDigits[(*input_byte) & 0xf];
    }
    return output_buffer;
}
