#pragma once

int print_credential(PCREDENTIAL credential, BOOL include_password);

int print_credential_no_secret(PCREDENTIAL credential);
int print_credential_with_secret(PCREDENTIAL credential);
