#include "stdafx.h"
#include "each_credential.h"

/*
 * Helper function that will query credential manager for the given
 * filter string and will call a function for each credential object
 * returned. Pass NULL to get all credentials.
 *
 * Returns 0 if success, otherwise returns the first non-zero return
 * code the callback returns.
 */
int for_each_credential(wchar_t *filter, cred_processor_func iterator)
{
    int err = 0;

    DWORD flags = 0;

    if (filter == NULL)
    {
        flags = CRED_ENUMERATE_ALL_CREDENTIALS;
    }

    PCREDENTIAL *credentials;
    DWORD numCredentials;
    BOOL result = CredEnumerate(filter, flags, &numCredentials, &credentials);
    if (!result)
    {
        err = GetLastError();
        if (err == ERROR_NOT_FOUND)
        {
            // Ok, no matches, just quit
            return 0;
        }

        fwprintf(stderr, L"Could not enumerate credentials in store, error code 0x%x\n", err);
        return err;
    }

    for (DWORD i = 0; i < numCredentials && err == 0; ++i)
    {
        err = iterator(credentials[i]);
    }

    CredFree(credentials);
    return err;
}

/*
 * Helper function that will load a single credential from the credential store
 * and call a function with the loaded credential object. Handles the memory
 * management.
 *
 * Returns either the error from the CredRead function or the return value of the
 * callback function.
 */
int for_one_credential(wchar_t *target_name, DWORD credential_type, cred_processor_func iterator)
{
    int err = 0;
    PCREDENTIAL credential;

    if (!CredRead(target_name, credential_type, 0, &credential))
    {
        err = GetLastError();
        switch (err)
        {
        case ERROR_NOT_FOUND:
            fwprintf(stderr, L"Credential not found\n");
            break;
        case ERROR_NO_SUCH_LOGON_SESSION:
            fwprintf(stderr, L"No login session\n");
            break;
        case ERROR_INVALID_FLAGS:
            fwprintf(stderr, L"INVALID FLAGS (Bad programming!)\n");
            break;
        default:
            fwprintf(stderr, L"Unexpected error code 0x%x\n", err);
            break;
        }
        return err;
    }

    err = iterator(credential);

    CredFree(credential);
    return err;
}
