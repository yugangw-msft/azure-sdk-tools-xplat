#include "stdafx.h"
#include "dispatch_command.h"
#include "credential_types.h"
#include "each_credential.h"

int delete_one_credential(PCREDENTIAL credential);
int delete_by_target_and_type(wchar_t *target_name, DWORD credential_type);

//
// Delete the given credential
//
int delete_credential(command_parameters_t *parameters)
{
    int err = validate_global_and_type_switches(parameters);
    set_default_credential_type(parameters);

    if (err) {
        return err;
    }

    if (parameters->use_filter)
    {
        return for_each_credential(parameters->credential_target_name, delete_one_credential);
    }

    return delete_by_target_and_type(parameters->credential_target_name, parameters->credential_type);
}

static int delete_one_credential(PCREDENTIAL credential)
{
    return delete_by_target_and_type(credential->TargetName, credential->Type);
}

static int delete_by_target_and_type(wchar_t *target_name, DWORD credential_type)
{
    int err = 0;
    if (!CredDelete(target_name, credential_type, 0))
    {
        err = GetLastError();
        if (err == ERROR_NOT_FOUND)
        {
            fwprintf(stderr, L"The credential target name %s with type %s was not found\n",
                target_name, credential_type_to_string(credential_type));
        }
        else
        {
            fwprintf(stderr, L"Unable to delete credential, error code 0x%x\n", err);
        }
    }
    return err;
}
