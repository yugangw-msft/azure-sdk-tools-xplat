#pragma once

typedef struct {
    int command_switch;
    DWORD credential_type;
    BOOL use_filter;
    wchar_t *credential_target_name;
    wchar_t *credential_blob_as_hex_string;
} command_parameters_t;

int dispatch_command(command_parameters_t *parameters);
void init_command_parameters(command_parameters_t *parameters);
void set_default_credential_type(command_parameters_t *parameters);
int validate_global_and_type_switches(command_parameters_t *parameters);
