#include "stdafx.h"
#include "dispatch_command.h"

typedef int (*command_handler_t)(command_parameters_t *parameters);

int list_credentials(command_parameters_t *parameters);
int show_credential(command_parameters_t *parameters);
int add_credential(command_parameters_t *parameters);
int delete_credential(command_parameters_t *parameters);

typedef struct {
    int command_switch;
    command_handler_t handler;
} command_dispatch_entry_t;

static command_dispatch_entry_t handlers[] = {
    { 'l', list_credentials },
    { 's', show_credential },
    { 'a', add_credential },
    { 'd', delete_credential }
};

#define NUM_HANDLERS (sizeof handlers / sizeof(handlers[0]))

int dispatch_command(command_parameters_t *parameters)
{
    for (int i = 0; i < NUM_HANDLERS; ++i)
    {
        if (handlers[i].command_switch == parameters->command_switch)
        {
            return handlers[i].handler(parameters);
        }
    }
    
    fprintf(stderr, "The command switch -%c is not currently implemented\n", parameters->command_switch);
    return 1;
}

void init_command_parameters(command_parameters_t *parameters)
{
    parameters->command_switch = -1;
    parameters->credential_type = -1;
    parameters->credential_target_name = NULL;
    parameters->credential_blob_as_hex_string = NULL;
    parameters->use_filter = FALSE;
}

void set_default_credential_type(command_parameters_t *parameters)
{
    if (parameters->credential_type == -1)
    {
        parameters->credential_type = CRED_TYPE_GENERIC;
    }
}

int validate_global_and_type_switches(command_parameters_t *parameters)
{
    if (parameters->use_filter && parameters->credential_type != -1) 
    {
        fwprintf(stderr, L"Cannot specify -g and -y switches together\n");
        return 1;
    }
    return 0;
}
