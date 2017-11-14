**If you are having an issue with commands related to an ARM based service, then please consider using [Azure CLI 2.0](https://github.com/Azure/azure-cli), the preferred choice for ARM (Azure Resource Manager) commands, rather than filing an issue in this repo.**

CLI 2.0 migration guide can be found [here](https://aka.ms/move2cli2).


- CLI Version: **0.10.X**
- OS Type: Mac / Win / Linux (Ubuntu, RedHat, etc.)
- Installation via:  npm / brew / win-or-mac installer / docker / github repo

- Mode: **ARM / ASM**

- Environment: **AzureCloud/Azure China Cloud/US Government/Blackforest/Azure Stack**

- Description:
`azure vm show` command doesn't output VM name.

- Steps to reproduce:
1) Run `azure vm create ...`
2) Then run `azure vm show ...`

- Error stack trace:

**Please paste the content of ~/.azure/azure.err or C:\Users\username\\.azure\azure.err over here**

If the issue is w.r.t `authentication` then please set `AZURE_ADAL_LOGGING_ENABLED=1` and then run the `azure login` command again. 
Please paste the verbose logs over here. (Make sure to delete the password before pasting the contents).

