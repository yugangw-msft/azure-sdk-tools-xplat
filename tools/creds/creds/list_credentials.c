#include "stdafx.h"
#include "credential_types.h"
#include "dispatch_command.h"
#include "print_credential.h"
#include "each_credential.h"


//
// List the contents of the credential store to stdout.
// This call does NOT output passwords.
//
int list_credentials(command_parameters_t *unused)
{
    return for_each_credential(NULL, print_credential_no_secret);
}
