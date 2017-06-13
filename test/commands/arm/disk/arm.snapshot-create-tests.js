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
var path = require('path');
var fs = require('fs');
var util = require('util');
var profile = require('../../../../lib/util/profile');
var testUtils = require('../../../util/util');
var CLITest = require('../../../framework/arm-cli-test');
var testprefix = 'arm.snapshot-parameter-create-tests';
var groupPrefix = 'xTestDiskCreate';
var groupPrefix2 = 'xTestDiskCreate2'
var VMTestUtil = require('../../../util/vmTestUtil');
var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'southeastasia'
}];

var groupName,
  location,
  diskPrefix = 'xplatSnapshot',
  paramFileName = 'test/data/snapshotParam.json',
  updateFileName = 'test/data/updateSnapshotParam.json',
  grantAccessFileName = 'test/data/snapshotGrantAccess.json',
  subscriptionId,
  imageId,
  mockEncryptionKeyVaultId,
  access;

var makeCommandStr = function(component, verb, file, others) {
  var cmdFormat = 'managed-snapshot config %s %s --parameter-file %s %s --json';
  return util.format(cmdFormat, component, verb, file, others ? others : '');
};

var makeGrantAccessCommandStr = function(component, verb, file, others) {
  var cmdFormat = 'managed-snapshot grant-access-parameters %s %s --parameter-file %s %s --json';
  return util.format(cmdFormat, component, verb, file, others ? others : '');
};

var makeUpdateParametersCommandStr = function(component, verb, file, others) {
  var cmdFormat = 'managed-snapshot update-parameters %s %s --parameter-file %s %s --json';
  return util.format(cmdFormat, component, verb, file, others ? others : '');
};

describe('arm', function() {
  describe('compute', function() {
    var suite, retry = 5;
    var vmTest = new VMTestUtil();
    before(function(done) {
      suite = new CLITest(this, testprefix, requiredEnvironment);
      suite.setupSuite(function() {
        location = process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.generateId(groupPrefix, null);
        diskPrefix = suite.generateId(diskPrefix, null);
        subscriptionId = profile.current.getSubscription().id;
        imageId = '/subscriptions/'+ subscriptionId +'/resourceGroups/' + groupName + '/providers/Microsoft.Compute/virtualMachineImages/testing123'; //fake
        mockEncryptionKeyVaultId = '/subscriptions/' + subscriptionId + '/resourceGroups/' + groupName + '/providers/Microsoft.KeyVault/vaults/TestVault123'; //fake
        access = 'Read';
        done();
      });
    });

    after(function(done) {
      this.timeout(vmTest.timeoutLarge * 10);
      vmTest.deleteUsedGroup(groupName, suite, function(result) {
        suite.teardownSuite(done);
      });
    });

    beforeEach(function(done) {
      suite.setupTest(done);
    });

    afterEach(function(done) {
      suite.teardownTest(done);
    });

    describe('snapshot', function() {

      it('snapshot config set, snapshot create should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.createGroup(groupName, location, suite, function(result) {
          var cmd = util.format('managed-snapshot config create --parameter-file %s --json', paramFileName).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = makeCommandStr('snapshot', 'set', paramFileName, util.format('--name %s --location %s', diskPrefix, location)).split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeCommandStr('sku', 'set', paramFileName, util.format('--name %s', 'Standard_LRS')).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeCommandStr('snapshot', 'set', paramFileName, util.format('--os-type %s', 'Windows')).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeCommandStr('snapshot', 'set', paramFileName, util.format('--disk-size-g-b %s --parse', 5)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = makeCommandStr('snapshot', 'set', paramFileName, util.format('--encryption-settings "%s" --parse', 'null')).split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      var cmd = makeCommandStr('creation-data', 'set', paramFileName, util.format('--create-option %s', 'Empty')).split(' ');
                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                        result.exitStatus.should.equal(0);
                        var cmd = makeCommandStr('creation-data', 'delete', paramFileName, '--image-reference --source-uri --storage-account-id --source-resource-id').split(' ');
                        testUtils.executeCommand(suite, retry, cmd, function(result) {
                          result.exitStatus.should.equal(0);
                          var cmd = util.format('managed-snapshot create --resource-group %s --name %s --parameter-file %s --json', groupName, diskPrefix, paramFileName).split(' ');
                          testUtils.executeCommand(suite, retry, cmd, function(result) {
                            result.exitStatus.should.equal(0);
                            done();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
  
      
      it('snapshot show should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('managed-snapshot show -g %s -n %s --json', groupName, diskPrefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          result.text.should.containEql(groupName);
          result.text.should.containEql(diskPrefix);
          done();
        });
      });


      it('snapshot update parameters, snapshot delete should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.createGroup(groupName, location, suite, function(result) {
        var cmd = util.format('managed-snapshot update-parameters create --parameter-file %s --json', updateFileName).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          var cmd = makeCommandStr('snapshot', 'set', updateFileName, util.format('--name %s --location %s', diskPrefix, location)).split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeUpdateParametersCommandStr('snapshot-update', 'set', updateFileName, util.format('--os-type %s --encryption-settings %s --tags %s', 'Windows', 'null', 'testtag')).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeUpdateParametersCommandStr('sku', 'set', updateFileName, util.format('--name %s', 'Premium_LRS')).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeUpdateParametersCommandStr('snapshot-update', 'set', updateFileName, util.format('--disk-size-g-b %s --parse', 5)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = makeUpdateParametersCommandStr('snapshot-update', 'delete', updateFileName, util.format('--tags')).split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      var cmd = makeUpdateParametersCommandStr('encryption-settings', 'set', updateFileName, util.format('--disk-encryption-key %s --key-encryption-key %s', mockEncryptionKeyVaultId, mockEncryptionKeyVaultId)).split(' ');
                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                        result.exitStatus.should.equal(0);
                        var cmd = makeUpdateParametersCommandStr('encryption-settings', 'delete', updateFileName, '--disk-encryption-key --key-encryption-key').split(' ');
                        testUtils.executeCommand(suite, retry, cmd, function(result) {
                          result.exitStatus.should.equal(0);
                          var cmd = util.format('managed-snapshot create --resource-group %s --name %s --parameter-file %s --json', groupName, diskPrefix, paramFileName).split(' ');
                          testUtils.executeCommand(suite, retry, cmd, function(result) {
                            result.exitStatus.should.equal(0);
                            var cmd = util.format('managed-snapshot update -g %s -n %s --parameter-file %s --json', groupName, diskPrefix, updateFileName).split(' ');
                            testUtils.executeCommand(suite, retry, cmd, function(result) {
                              result.exitStatus.should.equal(0);
                              var cmd = util.format('managed-snapshot delete -g %s -n %s --json', groupName, diskPrefix).split(' ');
                              testUtils.executeCommand(suite, retry, cmd, function(result) {
                                result.exitStatus.should.equal(0);
                                done();
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });

      it('snapshot grant access, snapshot grant-access-parameters patch should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
         vmTest.createGroup(groupName, location, suite, function(result) {
          var cmd = util.format('managed-snapshot create --resource-group %s --name %s --parameter-file %s --json', groupName, diskPrefix, paramFileName).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = util.format('managed-snapshot grant-access-parameters patch --parameter-file %s --operation replace --path /access --value %s', grantAccessFileName, 'Read').split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = util.format('managed-snapshot grant-access -g %s -n %s --parameter-file %s --json', groupName, diskPrefix, grantAccessFileName).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                done();
              });
            });
          });
        });
      });

      it('snapshot revoke access should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('managed-snapshot revoke-access -g %s -n %s --json', groupName, diskPrefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          var cmd = util.format('managed-snapshot delete -g %s -n %s --json', groupName, diskPrefix).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            done();
          });
        });
      });

      it('snapshot empty list should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('managed-snapshot list -g %s --json', groupName).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          result.text.should.containEql('[]');
          done();
        });
      });


    });
  });
});