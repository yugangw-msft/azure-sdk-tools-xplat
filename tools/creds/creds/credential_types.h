#pragma once

#include "stdafx.h"

wchar_t *credential_type_to_string(DWORD type);
BOOL string_to_credential_type(wchar_t *s, DWORD *type);
