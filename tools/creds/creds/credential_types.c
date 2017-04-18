#include "stdafx.h"
#include "credential_types.h"

static wchar_t *credential_types[] = {
    L"Undefined",
    L"Generic",
    L"DomainPassword",
    L"DomainCertificate",
    L"DomainVisiblePassword",
    L"GenericCertificate",
    L"DomainExtended"
};

#define NUM_CREDENTIAL_TYPES (sizeof credential_types / sizeof credential_types[0])

wchar_t *credential_type_to_string(DWORD type)
{
    if (type < 0 || type >= NUM_CREDENTIAL_TYPES)
    {
        return NULL;
    }
    return credential_types[type];
}

BOOL string_to_credential_type(wchar_t *s, DWORD *type)
{
    if (s == NULL || type == NULL)
    {
        return FALSE;
    }

    for (int i = 1; i < NUM_CREDENTIAL_TYPES; ++i)
    {
        if (_wcsicmp(s, credential_types[i]) == 0)
        {
            *type = i;
            return TRUE;
        }
    }

    *type = 0;
    return FALSE;
}

