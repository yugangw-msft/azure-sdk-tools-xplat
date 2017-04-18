// creds.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include "getopt.h"
#include "dispatch_command.h"
#include "credential_types.h"

// Globals used by getopt

wchar_t *__progname = L"creds";
wchar_t options[] = L"lsadgt:y:p:";

int wmain(int argc, wchar_t* argv[])
{
    command_parameters_t parameters;
    init_command_parameters(&parameters);
    
    int option;

    while ((option = getopt(argc, argv, options)) != EOF)
    {
        int option_index = optind ? optind : 1;
        switch (option)
        {
        case L'l':
        case L's':
        case L'a':
        case L'd':
            if (parameters.command_switch != -1)
            {
                fwprintf(stderr, L"Multiple command options given, only one is accepted\n");
                return 1;
            }
            parameters.command_switch = option;
            break;

        case L'g':
            parameters.use_filter = TRUE;
            break;

        case L't':
            if (parameters.credential_target_name != NULL)
            {
                fwprintf(stderr, L"The TargetName option (-t) cannot be given twice\n");
                return 1;
            }
            parameters.credential_target_name = optarg;
            break;

        case L'y':
            if (parameters.credential_type != -1)
            {
                fwprintf(stderr, L"The credential type option (-y) cannot be given twice\n");
                return 1;
            }

            if (!string_to_credential_type(optarg, &parameters.credential_type))
            {
                fwprintf(stderr, L"Unkown credential type %s\n", optarg);
                fwprintf(stderr, L"Valid credential types are:\n");
                wchar_t indent[] = L"    ";
                DWORD i = 1;
                wchar_t *known_credential_name = credential_type_to_string(i);
                while (known_credential_name != NULL)
                {
                    fwprintf(stderr, L"%s%s\n", indent, known_credential_name);
                    known_credential_name = credential_type_to_string(++i);
                }
                return 1;
            }
            break;

        case L'p':
            if (parameters.credential_blob_as_hex_string != NULL)
            {
                fwprintf(stderr, L"The password option (-p) cannot be given more than once\n");
                return 1;
            }
            parameters.credential_blob_as_hex_string = optarg;
            break;
        
        default:
            // getopt already send error to stderr, just bail.
            return 1;
        }
    }

    // If no command line arg given, assume -l if there's nothing else,
    // otherwise assume -s
    if (parameters.command_switch == -1)
    {
        if (optind >= argc)
        {
            parameters.command_switch = L'l';
        }
        else
        {
            parameters.command_switch = L's';
            parameters.credential_target_name = argv[optind++];
        }
    }

    if (parameters.credential_type != -1 && parameters.command_switch == L'l')
    {
        fwprintf(stderr, L"Cannot give -y switch for -l command\n");
        return 1;
    }

    if (parameters.command_switch != L'l' && parameters.credential_target_name == NULL)
    {
        if (optind >= argc)
        {
            fwprintf(stderr, L"Must specify TargetName parameter (-t switch)\n");
            return 1;
        }
        else
        {
            parameters.credential_target_name = argv[optind++];
        }
    }
    // Check if there's extra unconsumed options - if so error.
    if (optind < argc)
    {
        fwprintf(stderr, L"Too many arguments\n");
        return 1;
    }

    return dispatch_command(&parameters);
}
