/*
// Prototype for the getopt function.
*/

#pragma once

int getopt(int nargc, _TCHAR * const *nargv, const _TCHAR *ostr);

extern _TCHAR *progname;
extern _TCHAR *optarg;
extern int optind;

#define BADCH   (int)'?'
#define BADARG  (int)':'
