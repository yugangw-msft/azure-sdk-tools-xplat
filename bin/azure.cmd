@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\azure-cli\bin\azure" %*
) ELSE (
  node  "%~dp0\node_modules\azure-cli\bin\azure" %*
)