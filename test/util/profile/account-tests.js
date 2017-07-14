/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var should = require('should');

var Account = require('../../../lib/util/profile/account');

var expectedUserName = 'user@somedomain.example';
var expectedPassword = 'sekretPa$$w0rd';

var testTenantIds = ['2d006e8c-61e7-4cd2-8804-b4177a4341a1'];

var expectedSubscriptions =
 [
  {
    subscriptionId: 'db1ab6f0-4769-4b27-930e-01e2ef9c123c',
    displayName: 'Account',
    username: expectedUserName,
    activeDirectoryTenantId: testTenantIds[0]
  },
  {
    subscriptionId: 'db1ab6f0-4769-4b27-930e-01e2ef9c124d',
    displayName: 'Other',
    username: expectedUserName,
    activeDirectoryTenantId: testTenantIds[0]
  },
];

var testSubscriptionsFromTenant = [
  {
    subscriptionId: 'db1ab6f0-4769-4b27-930e-01e2ef9c123c',
    displayName: 'Account'
  },
  {
    subscriptionId: 'db1ab6f0-4769-4b27-930e-01e2ef9c124d',
    displayName: 'Other'
  }
];

var testArmSubscriptionClient = {
  subscriptions: {
    list: function (callback) {
      callback(null, testSubscriptionsFromTenant);
    }
  },
  tenants: {
    list: function (callback) {
      callback(null, testTenantIds.map(function (id) { return { tenantId: id }; }) );
    }
  }
};

var sampleAuthContext = {
  userId: expectedUserName,
  authConfig: { tenantId: testTenantIds[0] },
  retrieveTokenFromCache: function () { }
};

var environment = {
  activeDirectoryEndpointUrl: 'http://login.notreal.example',
  activeDirectoryResourceId: 'http://management.core.notreal.example',
  resourceManagerEndpointUrl: 'https://arm.notreal.example/',
  name: 'Azure',
  getAuthConfig: function (tenantId) {
    return {
      authorityUrl: 'http://login.notreal.example',
      tenantId: tenantId,
      resourceId: 'http://management.core.notreal.example'
    };
  }
};

var log = {
  info: function () { },
  verbose: function () { }
}

describe('account', function () {
  var dataPassedToAcquireToken, data2PassedToAcquireToken;
  var dataPassedToAcquireUserCode, dataPassedToAcquireTokenWithDeviceCode;
  
  var userCodeResponse = { foo: 'bar' };
  var adalAuth = {
    authenticateWithUsernamePassword: function (authConfig, username, password, callback) {
      var data = {
        authConfig: authConfig,
        username: username,
        password: password
      };
      if (dataPassedToAcquireToken) {
        data2PassedToAcquireToken = data;
      } else {
        dataPassedToAcquireToken = data;
      }
      return callback(null, sampleAuthContext);
    },
    
    acquireUserCode: function (authConfig, callback) {
      dataPassedToAcquireUserCode = { authConfig: authConfig };
      return callback(null, userCodeResponse);
    },
    
    authenticateWithDeviceCode: function (authConfig, userCodeResponse, callback) {
      dataPassedToAcquireTokenWithDeviceCode = {
        authConfig : authConfig,
        userCodeResponse: userCodeResponse,
      };
      return callback(null, sampleAuthContext);
    },
    
    normalizeUserName: function (name) { return name; },

    UserTokenCredentials: function UserTokenCredentials() { }
  };
  
  var armEndPointUsed;
  var resourceClient = {
    SubscriptionClient: function (cred, armEndpoint) {
      armEndPointUsed = armEndpoint;
      return testArmSubscriptionClient;
    }
  };
  var account = new Account(environment, adalAuth, resourceClient, log);
  
  describe('When load using non multifactor authentication', function () {
    var subscriptions;
    
    beforeEach(function (done) {
      account.load(expectedUserName, expectedPassword, '', {}, function (err, result) {
        subscriptions = result.subscriptions;
        done();
      });
    });
    
    it('should pass correct parameters to to acquire token', function () {
      dataPassedToAcquireToken.username.should.equal(expectedUserName);
      dataPassedToAcquireToken.password.should.equal(expectedPassword);     
      dataPassedToAcquireToken.authConfig.tenantId.should.equal('common');
      dataPassedToAcquireToken.authConfig.authorityUrl.should.equal(environment.activeDirectoryEndpointUrl);
      dataPassedToAcquireToken.authConfig.resourceId.should.equal(environment.activeDirectoryResourceId);
      
      //we should only ask for authenticateWithUsernamePassword once
      should.not.exist(data2PassedToAcquireToken);
    });
    
    it('should return a subscription with expected username', function () {
      should.exist(subscriptions[0].user);
      subscriptions[0].user.name.should.equal(expectedUserName);
    });
    
    it('should return listed subscriptions', function () {
      subscriptions.should.have.length(expectedSubscriptions.length);
      for (var i = 0, len = subscriptions.length; i < len; ++i) {
        subscriptions[i].id.should.equal(expectedSubscriptions[i].subscriptionId);
        subscriptions[i].name.should.equal(expectedSubscriptions[i].displayName);
      }
    });
    
    it('should have same username for all subscription', function () {
      subscriptions.forEach(function (s) {
        s.user.name.should.equal(expectedUserName);
      });
    });
    
    it('should have same tenant id for all subscription', function () {
      subscriptions.forEach(function (s) {
        s.tenantId.should.equal(testTenantIds[0]);
      });
    });

    it('should pass in right arm endpoint', function () {
      armEndPointUsed.should.equal(environment.resourceManagerEndpointUrl);
    });
  });
  
  describe('When load using interactive flow', function () {
    var subscriptions;
    
    beforeEach(function (done) {
      account.load(expectedUserName, expectedPassword, '', { interactive: true }, function (err, result) {
        subscriptions = result.subscriptions;
        done();
      });
    });
    
    it('should pass correct parameters to to acquireUserCode', function () {
      dataPassedToAcquireUserCode.authConfig.tenantId.should.equal('common');
      
      dataPassedToAcquireUserCode.authConfig.authorityUrl.should.equal(environment.activeDirectoryEndpointUrl);
      dataPassedToAcquireUserCode.authConfig.resourceId.should.equal(environment.activeDirectoryResourceId);
    });
    
    it('should pass correct parameters to authenticateWithDeviceCode', function () {
      dataPassedToAcquireTokenWithDeviceCode.authConfig.tenantId.should.equal('common');
      dataPassedToAcquireTokenWithDeviceCode.authConfig.authorityUrl.should.equal(environment.activeDirectoryEndpointUrl);
      dataPassedToAcquireTokenWithDeviceCode.authConfig.resourceId.should.equal(environment.activeDirectoryResourceId);
      
      dataPassedToAcquireTokenWithDeviceCode.userCodeResponse.foo.should.equal('bar');
    });
    
    it('should return listed subscriptions', function () {
      subscriptions.should.have.length(expectedSubscriptions.length);
      for (var i = 0, len = subscriptions.length; i < len; ++i) {
        subscriptions[i].id.should.equal(expectedSubscriptions[i].subscriptionId);
        subscriptions[i].name.should.equal(expectedSubscriptions[i].displayName);
      }
    });
  });
});

describe('account loading with logon error', function () {
  var adalAuth = {
    normalizeUserName: function (name) { return name; }
  };
  
  var account = new Account(environment, adalAuth, null, log);
  var subscriptions;
  
  it('should catch error indicating user is enabled with MFA', function () {
    adalAuth.authenticateWithUsernamePassword = function (authConfig, username, password, callback) {
      callback(new Error('AADSTS50076: Application password is required.'));
    };
    account.load(expectedUserName, expectedPassword, '', {}, function (err, result) {
      err[account.WarnToUserInteractiveFieldName].should.be.true;
    });
  });
  
  it('should catch error indicating user is using non org-id', function () {
    adalAuth.authenticateWithUsernamePassword = function (authConfig, username, password, callback) {
      callback(new Error('Server returned an unknown AccountType: undefined'));
    };
    account.load(expectedUserName, expectedPassword, '', {}, function (err, result) {
      err[account.WarnToUserInteractiveFieldName].should.be.true;
    });
  });
  
  it('should catch error user is using live-id', function () {
    adalAuth.authenticateWithUsernamePassword = function (authConfig, username, password, callback) {
      callback(new Error('Server returned error in RSTR - ErrorCode: NONE : FaultMessage: NONE'));
    };
    account.load(expectedUserName, expectedPassword, '', {}, function (err, result) {
      err[account.WarnToUserInteractiveFieldName].should.be.true;
    });
  });
  
  it('should return original error otherwise', function () {
    var regularError = 'wrong user name or password';
    adalAuth.authenticateWithUsernamePassword = function (authConfig, username, password, callback) {
      callback(new Error(regularError));
    };
    account.load(expectedUserName, expectedPassword, '', {}, function (err, result) {
      should.not.exist(err[account.WarnToUserInteractiveFieldName]);
      err.message.should.equal(regularError);
    });
  });
});

describe('account add for service principal', function () {
  var dataPassedToAcquireServicePrincipalToken;
  var servicePrincipalId = 'https://myapp';
  var secret = 'mysecret';
  var adalAuth = {
    createServicePrincipalTokenCredentials: function (authConfig, servicePrincipalId, secretOrCert, callback) {
      dataPassedToAcquireServicePrincipalToken = {
        authConfig: authConfig,
        servicePrincipalId: servicePrincipalId,
        secretOrCert: secretOrCert
      };
      return callback(null, sampleAuthContext);
    },
    normalizeUserName: function (name) { return name; }
  };
  var resourceClient = {
    SubscriptionClient: function (cred) {
      return testArmSubscriptionClient;
    }
  };
  var account = new Account(environment, adalAuth, resourceClient, log);
  
  describe('using secret', function () {
    var subscriptions;
    
    beforeEach(function (done) {
      account.load(servicePrincipalId, secret, 'fooTenant', { servicePrincipal: true }, function (err, result) {
        subscriptions = result.subscriptions;
        done();
      });
    });
    
    it('should invoke authenticateWithUsernamePassword with correct fields', function () {
      dataPassedToAcquireServicePrincipalToken.authConfig.tenantId.should.equal('fooTenant');
      dataPassedToAcquireServicePrincipalToken.servicePrincipalId.should.equal(servicePrincipalId);
      dataPassedToAcquireServicePrincipalToken.secretOrCert.should.equal(secret);
    });
    
    it('should return a subscription with expected servicePrincipalId', function () {
      should.exist(subscriptions[0].user);
      subscriptions[0].user.name.should.equal(servicePrincipalId);
    });
  });

  describe('using certificate and thumbprint', function () {
    var subscriptions;
    
    var cert = {
      'certificateFile' : 'junk',
      'thumbprint': 'junk'
    };

    beforeEach(function (done) {
      account.load(servicePrincipalId, cert, 'fooTenant', { servicePrincipal: true }, function (err, result) {
        subscriptions = result.subscriptions;
        done();
      });
    });
    
    it('should invoke authenticateWithUsernamePassword with correct fields', function () {
      dataPassedToAcquireServicePrincipalToken.authConfig.tenantId.should.equal('fooTenant');
      dataPassedToAcquireServicePrincipalToken.servicePrincipalId.should.equal(servicePrincipalId);
      dataPassedToAcquireServicePrincipalToken.secretOrCert.certificateFile.should.equal(cert.certificateFile);
      dataPassedToAcquireServicePrincipalToken.secretOrCert.thumbprint.should.equal(cert.thumbprint);
    });
    
    it('should return a subscription with expected servicePrincipalId', function () {
      should.exist(subscriptions[0].user);
      subscriptions[0].user.name.should.equal(servicePrincipalId);
    });
  });
});

describe('account', function () {
  var _fakedSubscriptions = [
    {
      subscriptionId: '0b1f6471-1bf0-4dda-aec3-cb9272f09590',
      displayName: 'Account'
    }
  ];

  var _mockedSubscriptionClient = {
    subscriptions: {
      list: function (callback) {
        callback(null, _fakedSubscriptions);
      }
    }
  };

  var resourceClient = {
    SubscriptionClient: function (cred, armEndpoint) {
      return _mockedSubscriptionClient;
    }
  };
  var findTokenInvoked = false;
  var existingTokensInCache = [];
  var tokensToAddIntoCache;
  var tokenCache = {
    find: function (query, callback) {
      findTokenInvoked = true
      return callback(null, existingTokensInCache);
    },
    add: function (entries, callback) {
      //verify entries number and content
      tokensToAddIntoCache = entries;
      return callback(null);
    }
  };
  var adalAuth = {
    UserTokenCredentials: function UserTokenCredentials() { }
  }
  expectedUserName = 'admin3@AzureSDKTeam.onmicrosoft.com';
  var account = new Account(environment, adalAuth, resourceClient, null/*log*/, tokenCache);
  var armToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Il9VZ3FYR190TUxkdVNKMVQ4Y2FIeFU3Y090YyIsImtpZCI6Il9VZ3FYR190TUxkdVNKMVQ4Y2FIeFU3Y090YyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC81NDgyNmIyMi0zOGQ2LTRmYjItYmFkOS1iN2I5M2EzZTljNWEvIiwiaWF0IjoxNDg4MjIxMzQ1LCJuYmYiOjE0ODgyMjEzNDUsImV4cCI6MTQ4ODIyNTI0NSwiYWNyIjoiMSIsImFpbyI6Ik5BIiwiYW1yIjpbInB3ZCJdLCJhcHBpZCI6IjA0YjA3Nzk1LThkZGItNDYxYS1iYmVlLTAyZjllMWJmN2I0NiIsImFwcGlkYWNyIjoiMCIsImVfZXhwIjoxMDgwMCwiZmFtaWx5X25hbWUiOiJzZGsiLCJnaXZlbl9uYW1lIjoiYWRtaW4zIiwiZ3JvdXBzIjpbImU0YmIwYjU2LTEwMTQtNDBmOC04OGFiLTNkOGE4Y2IwZTA4NiJdLCJpcGFkZHIiOiI1MC4zNS42NC4xNjEiLCJuYW1lIjoiYWRtaW4zIiwib2lkIjoiZTdlMTU4ZDMtN2NkYy00N2NkLTg4MjUtNTg1OWQ3YWIyYjU1IiwicGxhdGYiOiIxNCIsInB1aWQiOiIxMDAzM0ZGRjk1RDQ0RTg0Iiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiaFF6eXdvcVMtQS1HMDJJOXpkTlNGa0Z3dHYwZXBnaVZjVWx2bU9kRkdoUSIsInRpZCI6IjU0ODI2YjIyLTM4ZDYtNGZiMi1iYWQ5LWI3YjkzYTNlOWM1YSIsInVuaXF1ZV9uYW1lIjoiYWRtaW4zQEF6dXJlU0RLVGVhbS5vbm1pY3Jvc29mdC5jb20iLCJ1cG4iOiJhZG1pbjNAQXp1cmVTREtUZWFtLm9ubWljcm9zb2Z0LmNvbSIsInZlciI6IjEuMCIsIndpZHMiOlsiNjJlOTAzOTQtNjlmNS00MjM3LTkxOTAtMDEyMTc3MTQ1ZTEwIl19.nu8k1D48F76n1Efod97aYbwKKQkf0duX3QSMGffjGoYyTc36enkq_9IIuOUizys-O2Wy8zGvcprA9pLu25ngR2H8UNJU6I9dV8kdx7C_vpWiVjuGJA4yPOkKJfrG_B8gpyh_dGNXLm81XHZn9UnOU-XY3DRc3I1hSAVoSVOW16JIRQEeEJ0WIi_PKAeuVg8hOEqRVvixEWQJN-yJV2_QxECt5LoAWoG3SlhBoU3-4dTYlceeXaQHVOOjkgZ0IE-dy-i550hsSAYzc1yKix-PL5F3We2_n1b8-bzBOkIjZsxjVegicrFuKbFvMaGwpiTqTBbsS0d6XihptTgEnef07A';

  describe('load subscriptions using arm token provided by azure console', function () {
    var subscriptions;
    findTokenInvoked = false;
    existingTokensInCache = [];
    tokensToAddIntoCache = [];
    beforeEach(function (done) {
      process.env['AZURE_CONSOLE_TOKENS'] = armToken;
      account.load(null/*user*/, null/*password*/, null/*tenant*/, { 'cloudConsoleLogin': true }, function (err, result) {
        subscriptions = result.subscriptions;
        delete process.env['AZURE_CONSOLE_TOKENS'];
        done();
      });
    });

    it('should look for existing token entries from cache', function () {
      findTokenInvoked.should.be.true;
    });

    it('should add new token entries into cache', function () {
      tokensToAddIntoCache.should.have.length(1)
      tokensToAddIntoCache[0]._userId.should.equal(expectedUserName);
      tokensToAddIntoCache[0].isMRRT.should.be.true;
    });

    it('should return listed subscriptions', function () {
      subscriptions.should.have.length(_fakedSubscriptions.length);
      should.exist(subscriptions[0].user);
      subscriptions[0].user.name.should.equal(expectedUserName);
      for (var i = 0, len = subscriptions.length; i < len; ++i) {
        subscriptions[i].id.should.equal(_fakedSubscriptions[i].subscriptionId);
        subscriptions[i].name.should.equal(_fakedSubscriptions[i].displayName);
      }
    });
  });

  describe('merge with existing tokens provided by azure console', function () {
    var subscriptions;

    beforeEach(function (done) {
      process.env['AZURE_CONSOLE_TOKENS'] = armToken;
      findTokenInvoked = false;
      tokensToAddIntoCache = [];
      existingTokensInCache = [
        {
          "userId": "admin3@azuresdkteam.onmicrosoft.com",
          "accessToken": "arm-token",
          "resource": "https://management.core.windows.net/",
          "_clientId": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",
          "_authority": "https://login.microsoftonline.com/54826b22-38d6-4fb2-bad9-b7b93a3e9c5a",
        },
        {
          "userId": "admin3@azuresdkteam.onmicrosoft.com",
          "accessToken": "graph-token",
          "resource": "https://graph.windows.net/",
          "_clientId": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",
          "_authority": "https://login.microsoftonline.com/54826b22-38d6-4fb2-bad9-b7b93a3e9c5a",
        },
        {
          "userId": "admin3@AzureSDKTeam.onmicrosoft.com",
          "accessToken": "keyvault-token",
          "_authority": "https://login.microsoftonline.com/54826b22-38d6-4fb2-bad9-b7b93a3e9c5a",
          "resource": "https://vault.azure.net",
          "_clientId": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",
        }];
      account.load(null/*user*/, null/*password*/, null/*tenant*/, { 'cloudConsoleLogin': true }, function (err, result) {
        subscriptions = result.subscriptions;
        delete process.env['AZURE_CONSOLE_TOKENS'];
        done();
      });
    });

    it('should look for existing token entries from cache', function () {
      findTokenInvoked.should.be.true;
    });

    it('should add merged token entries into cache', function () {
      tokensToAddIntoCache.should.have.length(3);
      tokensToAddIntoCache[0].resource.should.equal('https://management.core.windows.net/');
      tokensToAddIntoCache[1].resource.should.equal('https://graph.windows.net/');
      tokensToAddIntoCache[2].resource.should.equal('https://vault.azure.net');
    });
  });
});