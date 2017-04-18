#include "stdafx.h"
#include "dispatch_command.h"
#include "credential_types.h"
#include "print_credential.h"
#include "each_credential.h"

int show_credential(command_parameters_t *parameters)
{
    int err = validate_global_and_type_switches(parameters);
    set_default_credential_type(parameters);
    if (err) 
    {
        return err;
    }

    if (parameters->use_filter) {
        return for_each_credential(parameters->credential_target_name, print_credential_with_secret);
    }

    return for_one_credential(parameters->credential_target_name, parameters->credential_type, print_credential_with_secret);
}
