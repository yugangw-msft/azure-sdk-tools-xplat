var jwtDecode = require('jwt-decode');
var adalAuth = require('./util/authentication/adalAuth');
var constants = require('./util/constants.js');

function AzueConsoleAccount(env, adalAuth, resourceClient) {
    this._env = env;
    this._adalAuth = adalAuth;
    this._resourceClient = resourceClient;
}

AzueConsoleAccount.prototype.isInConsole = function () {
    return process.env['AZURE_CONSOLE'];
}

AzueConsoleAccount.prototype.login = function () {
    client_id = constants.XPLAT_CLI_CLIENT_ID;
    tokens = process.env['AZURE_CONSOLE_TOKEN'].split(';');
    arm_token_info = jwtDecode(tokens[0]);
    token_storage = fileTokenStorage(
    //decode

    //update ~/.azure/accessTokens.json
    /*
  {
    "_clientId": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",
    "expiresOn": "2017-02-13T06:16:36.209Z",
    "userId": "admin3@azuresdkteam.onmicrosoft.com",
    "_authority": "https://login.microsoftonline.com/common",
    "resource": "https://management.core.windows.net/",
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Il9VZ3FYR190TUxkdVNKMVQ4Y2FIeFU3Y090YyIsImtpZCI6Il9VZ3FYR190TUxkdVNKMVQ4Y2FIeFU3Y090YyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC81NDgyNmIyMi0zOGQ2LTRmYjItYmFkOS1iN2I5M2EzZTljNWEvIiwiaWF0IjoxNDg2OTYyNjk4LCJuYmYiOjE0ODY5NjI2OTgsImV4cCI6MTQ4Njk2NjU5OCwiYWNyIjoiMSIsImFpbyI6IkFRQUJBQUVBQUFEUk5ZUlEzZGhSU3JtLTRLLWFkcENKaFE2VVBvQ1VJQV80ZWduZFFmOWdZY2MzdWh0bGxxOVJjNnp3TmVUbHdVSWdMTkRMVjFkQmhHcDdmSlRaUkNKSG5lZHVnQmZtLTVoWWRMUWtMWGZQQ2hYVDE4X3hjM1hBNFp6TnFVVU1hbmhZN2kwbjhHSnVWZVB0WkdXalVlYmdJQUEiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiMDRiMDc3OTUtOGRkYi00NjFhLWJiZWUtMDJmOWUxYmY3YjQ2IiwiYXBwaWRhY3IiOiIwIiwiZV9leHAiOjEwODAwLCJmYW1pbHlfbmFtZSI6InNkayIsImdpdmVuX25hbWUiOiJhZG1pbjMiLCJncm91cHMiOlsiZTRiYjBiNTYtMTAxNC00MGY4LTg4YWItM2Q4YThjYjBlMDg2Il0sImlwYWRkciI6IjUwLjM1LjY0LjE2MSIsIm5hbWUiOiJhZG1pbjMiLCJvaWQiOiJlN2UxNThkMy03Y2RjLTQ3Y2QtODgyNS01ODU5ZDdhYjJiNTUiLCJwbGF0ZiI6IjE0IiwicHVpZCI6IjEwMDMzRkZGOTVENDRFODQiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJoUXp5d29xUy1BLUcwMkk5emROU0ZrRnd0djBlcGdpVmNVbHZtT2RGR2hRIiwidGlkIjoiNTQ4MjZiMjItMzhkNi00ZmIyLWJhZDktYjdiOTNhM2U5YzVhIiwidW5pcXVlX25hbWUiOiJhZG1pbjNAQXp1cmVTREtUZWFtLm9ubWljcm9zb2Z0LmNvbSIsInVwbiI6ImFkbWluM0BBenVyZVNES1RlYW0ub25taWNyb3NvZnQuY29tIiwidmVyIjoiMS4wIiwid2lkcyI6WyI2MmU5MDM5NC02OWY1LTQyMzctOTE5MC0wMTIxNzcxNDVlMTAiXX0.IS4OJ-pMIVBk7pluKZ3OgxIRL4yJFWGrMLTy7NVoL4AT8vezt7ZhDuz6cX8HpjD7h3YVeiwiKAbEw1DoF0cvED49gomQsZaSDuNUllJA4j40SmNSaohyL9paOMQILFeUBolFKLpSkO4KIz94SKfQW9_DSoN91zajf8I8IYr_qZMZTTbitySKDsQ5RmrgI-xg1Qx3pSkeMxQUOhxekJ7XhFZRDbR6AUa1Zhejzjtlks10eGCFJDOqZYNgaMQjAwrJn27k-mkCZwjpa5VkgShL0Mtgcw3ePcxPSoL7k_u1U1DThLdtS0840e11VG2NNwfgQG9jQMS7plQzjTzT-sWVuw",
    "isMRRT": true,
    "refreshToken": "AQABAAAAAADRNYRQ3dhRSrm-4K-adpCJmWp1uRe9lxLWsFFFcP6kO_YNLTJOGvpGCVd702FKFQJRRvJKfQZOlKUks1Y9lCwCoXm8zMIJDoKKGGvMYkIx9-PBwoVWSSH06NEz_aQ0bzedlZjYfw6dJFEW9usoGQlKgrRpJfG8ihStBvBISg9vtEvrWQzAtrhhyCZz_e5bpaSg_JBUmonEQKyLsKec6PU73wKWPwzHiDJssfLpxkfnB5DrRQygKCU6hO7JXtmHb3QZ7xYeVKdVP9pLY8v5-dwHgyrF_aoFFlklbKDs-_ZVMLyP1_QIMkf7z-Rj5qN66FQHs86FSGx6cAeFVqNcMDtC62iXw5zb0phVp5fsw69xUS7eV5lk7T_2Bs-nLO4kuEg6QizinsbGopH8_piSD5Mcn5UYiEvoaX9iFiQstsftOX0bYo-TAHutMU3JVU2FVmkb2c4W1oxYrZ5afgw5-OiG_LzzyCQxV-Od5WRY6_gMQN_wJ5wNyplshvUx24z9xIJ9wnutCnvSljLcBGN_IsaSIlTk-5WyUCMixoFLGULe9Bn6gOnPbZ12xx_2iMyia8zZTGT2C-q4APriUq7wasimCazQwlj_0hC098T_TBB0ROP5qMRdsSZDQIW2X9tGwEt-ti6988wF0vCKrmuNHjscIAA",
    "tokenType": "Bearer",
    "expiresIn": 3599,
    "oid": "e7e158d3-7cdc-47cd-8825-5859d7ab2b55"
  },
    */

}