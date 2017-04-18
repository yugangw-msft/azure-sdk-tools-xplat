#pragma once

typedef int(*cred_processor_func)(PCREDENTIAL credential);

int for_each_credential(wchar_t *filter, cred_processor_func iterator);
int for_one_credential(wchar_t *target_type, DWORD credential_type, cred_processor_func iterator);
