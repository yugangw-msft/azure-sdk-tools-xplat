//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//
'use strict';

var should = require('should');
var utils = require('../../../../lib/util/utils');
var CLITest = require('../../../framework/arm-cli-test');

var storageNamesPrefix = 'armclistorageaccount';
var storageGroupPrefix = 'armclistorageGroup';
var storageNames = [];
var storagePairs = [];
var createdResourceGroups = [];
var storageLocation;
var accountKind;
var resourceGroupLocation;

var requiredEnvironment = [
  { name: 'AZURE_STORAGE_TEST_LOCATION', defaultValue: 'West Europe' },
  { name: 'AZURE_STORAGE_TEST_TYPE', defaultValue: 'LRS' },
  { name: 'AZURE_STORAGE_TEST_KIND', defaultValue: 'storage' },
  { name: 'AZURE_RESOURCE_GROUP_TEST_LOCATION', defaultValue: 'West US' }
];

var testPrefix = 'arm-cli-storage-account-tests';
var suite;
var liveOnly = process.env.NOCK_OFF ? it : it.skip;
var timeBeforeSetAvailable;

describe('arm', function () {
  describe('storage account', function () {
    var storageName;
    var resrouceGroupName;
    var accountType;
    var primaryKey;

    before(function (done) {
      suite = new CLITest(this, testPrefix, requiredEnvironment);
      timeBeforeSetAvailable = (!suite.isMocked || suite.isRecording) ? 30000 : 10;
      if (suite.isMocked) {
        utils.POLL_REQUEST_INTERVAL = 0;
      }

      suite.setupSuite(done);
    });

    after(function (done) {
      suite.teardownSuite(function() {
        if (!suite.isPlayback()) {
          storagePairs.forEach(function(pair) {
            suite.execute('storage account delete %s --resource-group %s --json -q', pair[0], pair[1], function (result) {
              result.exitStatus.should.equal(0);
              suite.execute('group delete %s --json -q', pair[1], function (result) {
                result.exitStatus.should.equal(0);
                done();
              })
            });
          });
        } else {
          done();
        }
      });
    });

    beforeEach(function (done) {
      suite.setupTest(function () {
        resourceGroupLocation = process.env.AZURE_RESOURCE_GROUP_TEST_LOCATION;
        storageLocation = process.env.AZURE_STORAGE_TEST_LOCATION;
        accountType = process.env.AZURE_STORAGE_TEST_TYPE;
        accountKind = process.env.AZURE_STORAGE_TEST_KIND;
        done();
      });
    });

    afterEach(function (done) {
      suite.teardownTest(done);
    });

    it('should create a storage account with resource group and location', function(done) {
      storageName = suite.generateId(storageNamesPrefix, storageNames);
      resrouceGroupName = suite.generateId(storageGroupPrefix, createdResourceGroups);
      storagePairs.push([storageName, resrouceGroupName]);

      suite.execute('group create %s --location %s --json', resrouceGroupName, resourceGroupLocation, function (result) {
        result.exitStatus.should.equal(0);
        
        suite.execute('storage account create %s --resource-group %s --sku-name %s --location %s --kind %s --enable-encryption-service blob --json', 
          storageName, resrouceGroupName, accountType, storageLocation, accountKind, function (result) {
          result.text.should.equal('');
          result.exitStatus.should.equal(0);
          done();
        });
      });
    });
    
    it('should create a COOL storage account', function(done) {
      storageName = suite.generateId(storageNamesPrefix, storageNames);
      storagePairs.push([storageName, resrouceGroupName]);
      suite.execute('storage account create %s --resource-group %s --sku-name %s --location %s --kind %s --access-tier Cool --enable-encryption-service blob --json', 
        storageName, resrouceGroupName, accountType, storageLocation, 'BlobStorage', function (result) {
        result.text.should.equal('');
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('should list storage accounts within the subscription', function(done) {
      storageName = suite.generateId(storageNamesPrefix, storageNames);
      resrouceGroupName = suite.generateId(storageGroupPrefix, createdResourceGroups);
      storagePairs.push([storageName, resrouceGroupName]);

      suite.execute('group create %s --location %s --json', resrouceGroupName, resourceGroupLocation, function (result) {
        result.exitStatus.should.equal(0);

        suite.execute('storage account create %s --resource-group %s --sku-name %s --location %s --kind %s --json', 
          storageName, resrouceGroupName, accountType, storageLocation, accountKind, function (result) {
          result.text.should.equal('');
          result.exitStatus.should.equal(0);
          
          suite.execute('storage account list --json', function (result) {
            var storageAccounts = JSON.parse(result.text);
            storageAccounts.some(function (account) {
              return account.name === storageName;
            }).should.be.true;
            done();
          });
        });
      });
    });

    it('should list storage accounts within the resource group', function(done) {
      suite.execute('storage account list --resource-group %s --json', resrouceGroupName, function (result) {
        var storageAccounts = JSON.parse(result.text);
        storageAccounts.some(function (account) {
          return account.name === storageName;
        }).should.be.true;

        done();
      });
    })
    
    it('should check the storage account name', function(done) {
      suite.execute('storage account check %s --json', storageName, function (result) {
        var result = JSON.parse(result.text);
        result.nameAvailable.should.be.false;
        result.reason.should.equal('AlreadyExists');

        done();
      });
    })

    // Wait for the created account becoming available to change
    it('should update storage accounts', function(done) {
      setTimeout(function () {
        suite.execute('storage account set %s --resource-group %s --sku-name RAGRS --disable-encryption-service blob --json', storageName, resrouceGroupName, function (result) {
          result.text.should.equal('');
          result.exitStatus.should.equal(0);

          suite.execute('storage account show %s --resource-group %s --json', storageName, resrouceGroupName, function (result) {
            var storageAccount = JSON.parse(result.text);
            storageAccount.sku.name.should.equal('Standard_RAGRS');

            done();
          });
        });
      }, timeBeforeSetAvailable);
    });

    it('should renew storage keys', function(done) {
      suite.execute('storage account keys list %s --resource-group %s --json', storageName, resrouceGroupName, function (result) {
        var storageAccountKeys = JSON.parse(result.text);
        storageAccountKeys[0].should.not.be.null;
        storageAccountKeys[1].should.not.be.null;

        suite.execute('storage account keys renew %s --resource-group %s --primary --json', storageName, resrouceGroupName, function (result) {
          result.exitStatus.should.equal(0);

          storageAccountKeys = JSON.parse(result.text);
          storageAccountKeys[0].should.not.be.null;
          primaryKey = storageAccountKeys[0].value;
          storageAccountKeys[1].should.not.be.null;
          done();
        });
      });
    });
    
    it('should show connecting string', function(done) {
      suite.execute('storage account connectionstring show %s --resource-group %s --json', storageName, resrouceGroupName, function(result) {
        var connectionString = JSON.parse(result.text);
        var desiredConnectionString = 'DefaultEndpointsProtocol=https;AccountName=' + storageName + ';AccountKey=' + primaryKey;
        connectionString.string.should.equal(desiredConnectionString);
        result.exitStatus.should.equal(0);
        done();
      });
    });
    
    it('should show connecting string with endpoints', function (done) {
      suite.execute('storage account connectionstring show --use-http --blob-endpoint myBlob.ep --queue-endpoint 10.0.0.10 --table-endpoint mytable.core.windows.net %s --resource-group %s --json',
        storageName, 
        resrouceGroupName, 
        function(result) {
          var connectionString = JSON.parse(result.text);
          var desiredConnectionString = 'DefaultEndpointsProtocol=http;BlobEndpoint=myBlob.ep;QueueEndpoint=10.0.0.10;TableEndpoint=mytable.core.windows.net;AccountName='+ storageName + ';AccountKey=' + primaryKey;
          connectionString.string.should.equal(desiredConnectionString);
          result.exitStatus.should.equal(0);
          done();
        }
      );
    });

    it('should show the account usage', function (done) {
      suite.execute('storage account usage show --json', function(result) {
        var usage = JSON.parse(result.text);
        usage.subscriptionId.should.not.be.null;
        usage.used.should.be.above(-1);
        usage.limit.should.be.above(50);
        done();
      });
    });
  });
});