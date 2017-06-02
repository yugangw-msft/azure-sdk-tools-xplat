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
var testprefix = 'arm-cli-managed-disk-vm-parameter-create-tests';
var groupPrefix = 'xplatTstPvmGCreate';
var VMTestUtil = require('../../../util/vmTestUtil');
var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'westus'
}, {
  name: 'SSHCERT',
  defaultValue: 'test/myCert.pem'
}];

var groupName,
  avsPrefix7 = 'xplattestavs7',
  vm1Prefix = 'vm1',
  vm2Prefix = 'vm2',
  location,
  username = 'azureuser',
  password = 'Brillio@2016',
  vmSize,
  sshcert,
  avsParamFileName = 'test/data/avs7Param.json',
  pvmParamFileName = 'test/data/pvm7Param.json',
  pvmParamFileName2 = 'test/data/pvm7Param2.json',
  imgParamFileName = 'test/data/img7Param.json',
  storageAccount = 'xplatteststorage1',
  nicName = 'xplattestnic',
  nicName2 = 'xplattestni2',
  vNetPrefix = 'xplattestvnet',
  subnetName = 'xplattestsubnet',
  publicipName = 'xplattestip',
  dnsPrefix = 'xplattestipdns';
  
var makeCommandStr = function(category, component, verb, file, others) {
  var cmdFormat = category + ' config %s %s --parameter-file %s %s --json';
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
        sshcert = process.env.SSHCERT;
        groupName = suite.generateId(groupPrefix, null);
        vm1Prefix = suite.generateId(vm1Prefix, null);
        vm2Prefix = suite.generateId(vm2Prefix, null);
        avsPrefix7 = suite.isMocked ? avsPrefix7 : suite.generateId(avsPrefix7, null);
        nicName = suite.generateId(nicName, null);
        nicName2 = suite.generateId(nicName2, null);
        storageAccount = suite.generateId(storageAccount, null);
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

    describe('managed-disk-vm', function() {

      it('required resources (group) create should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.checkImagefile(function() {
          vmTest.createGroup(groupName, location, suite, function(result) {
            var cmd = util.format('storage account create -g %s --sku-name GRS --kind Storage --location %s %s --json', groupName, location, storageAccount).split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = util.format('network vnet create %s %s %s -a 10.0.0.0/16 --json', groupName, vNetPrefix, location).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = util.format('network vnet subnet create -a 10.0.0.0/24 %s %s %s --json', groupName, vNetPrefix, subnetName).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = util.format('network nic create %s %s %s --subnet-vnet-name %s --subnet-name %s --json', groupName, nicName, location, vNetPrefix, subnetName).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = util.format('network nic create %s %s %s --subnet-vnet-name %s --subnet-name %s --json', groupName, nicName2, location, vNetPrefix, subnetName).split(' ');
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

      it('create-or-update-parameter generate set and remove should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.getVMSize(location, suite, function() {
          var cmd = util.format('availset config create --parameter-file %s', avsParamFileName).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = makeCommandStr('availset', 'availability-set', 'delete', avsParamFileName, '--statuses --tags --type --name --id --virtual-machines --sku').split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeCommandStr('availset', 'availability-set', 'set', avsParamFileName, '--parse --platform-update-domain-count 3 --platform-fault-domain-count 2').split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeCommandStr('availset', 'sku', 'set', avsParamFileName, util.format('--name %s', 'Aligned')).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeCommandStr('availset', 'availability-set', 'set', avsParamFileName, util.format('--name %s --location %s', avsPrefix7, location)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = util.format('availset create-or-update -g %s -n %s --parameter-file %s', groupName, avsPrefix7, avsParamFileName).split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      result.text.should.containEql('Aligned');
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
      
      it('diskvm create-or-update-parameter generate set and remove should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var subscription = profile.current.getSubscription();
        var avsetId = '/subscriptions/' + subscription.id + '/resourceGroups/' + groupName + '/providers/Microsoft.Compute/availabilitySets/' + avsPrefix7;
        var nicId = util.format('/subscriptions/%s/resourceGroups/%s/providers/Microsoft.Network/networkInterfaces/%s', subscription.id, groupName, nicName);
        vmTest.getVMSize(location, suite, function() {
          vmSize = VMTestUtil.vmSize;
          var cmd = util.format('vm config create --parameter-file %s', pvmParamFileName).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = makeCommandStr('vm', 'virtual-machine', 'delete', pvmParamFileName, '--plan --diagnostics-profile --provisioning-state --instance-view --license-type --vm-id --resources --tags --type --id --identity').split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeCommandStr('vm', 'virtual-machine', 'set', pvmParamFileName, util.format('--location %s --name %s', location, vm1Prefix)).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeCommandStr('vm', 'availability-set', 'set', pvmParamFileName, util.format('--id %s', avsetId)).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeCommandStr('vm', 'hardware-profile', 'set', pvmParamFileName, util.format('--vm-size', vmSize)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = makeCommandStr('vm', 'os-profile', 'delete', pvmParamFileName, '--secrets --custom-data --windows-configuration').split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      var cmd = makeCommandStr('vm', 'os-profile', 'set', pvmParamFileName, util.format('--computer-name %s --admin-username %s --admin-password %s', 'diskvm1', username, password)).split(' ');
                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                        result.exitStatus.should.equal(0);
                        var cmd = makeCommandStr('vm', 'linux-configuration', 'set', pvmParamFileName, '--disable-password-authentication false').split(' ');
                        testUtils.executeCommand(suite, retry, cmd, function(result) {
                          result.exitStatus.should.equal(0);
                          var cmd = makeCommandStr('vm', 'linux-configuration', 'delete', pvmParamFileName, '--ssh').split(' ');
                          testUtils.executeCommand(suite, retry, cmd, function(result) {
                            result.exitStatus.should.equal(0);
                            var cmd = makeCommandStr('vm', 'storage-profile', 'delete', pvmParamFileName, '--data-disks').split(' ');
                            testUtils.executeCommand(suite, retry, cmd, function(result) {
                              result.exitStatus.should.equal(0);
                              var cmd = makeCommandStr('vm', 'image-reference', 'delete', pvmParamFileName, '--id').split(' ');
                              testUtils.executeCommand(suite, retry, cmd, function(result) {
                                result.exitStatus.should.equal(0);
                                var cmd = makeCommandStr('vm', 'image-reference', 'set', pvmParamFileName, '--publisher CoreOS --offer CoreOS --sku Stable --version latest').split(' ');
                                testUtils.executeCommand(suite, retry, cmd, function(result) {
                                  result.exitStatus.should.equal(0);
                                  var cmd = makeCommandStr('vm', 'os-disk', 'set', pvmParamFileName, '--caching None --create-option fromImage').split(' ');
                                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                                    result.exitStatus.should.equal(0);
                                    var cmd = makeCommandStr('vm', 'os-disk', 'delete', pvmParamFileName, '--os-type --image --encryption-settings --managed-disk --vhd --name').split(' ');
                                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                                      result.exitStatus.should.equal(0);
                                      var cmd = makeCommandStr('vm', 'network-interfaces', 'set', pvmParamFileName, util.format('--index 0 --id %s', nicId)).split(' ');
                                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                                        result.exitStatus.should.equal(0);
                                        var cmd = util.format('vm create-or-update -g %s -n %s --parameter-file %s --json', groupName, vm1Prefix, pvmParamFileName).split(' ');
                                        testUtils.executeCommand(suite, retry, cmd, function(result) {
                                          result.exitStatus.should.equal(0);
                                          result.text.should.not.containEql('blob');
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
              });
            });
          });
        });
      });

      it('vm delete command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('vm delete --resource-group %s --name %s -q --json', groupName, vm1Prefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      
      it('diskvm 2nd create-or-update call should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var subscription = profile.current.getSubscription();
        var avsetId = '/subscriptions/' + subscription.id + '/resourceGroups/' + groupName + '/providers/Microsoft.Compute/availabilitySets/' + avsPrefix7;
        var nicId2 = util.format('/subscriptions/%s/resourceGroups/%s/providers/Microsoft.Network/networkInterfaces/%s', subscription.id, groupName, nicName2);
        vmTest.getVMSize(location, suite, function() {
          vmSize = VMTestUtil.vmSize;
          var cmd = util.format('vm config create --parameter-file %s', pvmParamFileName2).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = makeCommandStr('vm', 'virtual-machine', 'delete', pvmParamFileName2, '--plan --hardware-profile --storage-profile --os-profile --network-profile --diagnostics-profile --availability-set --identity').split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeCommandStr('vm', 'virtual-machine', 'delete', pvmParamFileName2, ' --provisioning-state --instance-view --license-type --vm-id --resources --id --name --type --location --tags').split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeCommandStr('vm', 'virtual-machine', 'set', pvmParamFileName2, util.format('--location %s --name %s', location, vm2Prefix)).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeCommandStr('vm', 'virtual-machine', 'set', pvmParamFileName2, util.format('--hardware-profile {} --storage-profile {} --os-profile {} --network-profile {} --availability-set {} --parse')).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = makeCommandStr('vm', 'availability-set', 'set', pvmParamFileName2, util.format('--id %s', avsetId)).split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      var cmd = makeCommandStr('vm', 'hardware-profile', 'set', pvmParamFileName2, util.format('--vm-size', vmSize)).split(' ');
                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                        result.exitStatus.should.equal(0);
                        var cmd = makeCommandStr('vm', 'os-profile', 'set', pvmParamFileName2, '--linux-configuration {} --parse').split(' ');
                        testUtils.executeCommand(suite, retry, cmd, function(result) {
                          result.exitStatus.should.equal(0);
                          var cmd = makeCommandStr('vm', 'os-profile', 'set', pvmParamFileName2, util.format('--computer-name %s --admin-username %s --admin-password %s', 'diskvm1', username, password)).split(' ');
                          testUtils.executeCommand(suite, retry, cmd, function(result) {
                            result.exitStatus.should.equal(0);
                            var cmd = makeCommandStr('vm', 'linux-configuration', 'set', pvmParamFileName2, '--disable-password-authentication false').split(' ');
                            testUtils.executeCommand(suite, retry, cmd, function(result) {
                              result.exitStatus.should.equal(0);
                              var cmd = makeCommandStr('vm', 'linux-configuration', 'delete', pvmParamFileName2, '--ssh').split(' ');
                              testUtils.executeCommand(suite, retry, cmd, function(result) {
                                result.exitStatus.should.equal(0);
                                var cmd = makeCommandStr('vm', 'storage-profile', 'set', pvmParamFileName2, '--os-disk {} --image-reference {} --parse').split(' ');
                                testUtils.executeCommand(suite, retry, cmd, function(result) {
                                  result.exitStatus.should.equal(0);
                                  var cmd = makeCommandStr('vm', 'image-reference', 'set', pvmParamFileName2, '--publisher CoreOS --offer CoreOS --sku Stable --version latest').split(' ');
                                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                                    result.exitStatus.should.equal(0);
                                    var cmd = makeCommandStr('vm', 'os-disk', 'set', pvmParamFileName2, '--caching None --create-option fromImage').split(' ');
                                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                                      result.exitStatus.should.equal(0);
                                      var cmd = makeCommandStr('vm', 'os-disk', 'delete', pvmParamFileName2, '--os-type --image --encryption-settings --managed-disk --vhd --name').split(' ');
                                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                                        result.exitStatus.should.equal(0);
                                        var cmd = makeCommandStr('vm', 'network-profile', 'set', pvmParamFileName2, '--network-interfaces [] --parse').split(' ');
                                        testUtils.executeCommand(suite, retry, cmd, function(result) {
                                          result.exitStatus.should.equal(0);
                                          var cmd = makeCommandStr('vm', 'network-interfaces', 'set', pvmParamFileName2, util.format('--index 0 --id %s', nicId2)).split(' ');
                                          testUtils.executeCommand(suite, retry, cmd, function(result) {
                                            result.exitStatus.should.equal(0);
                                            var cmd = util.format('vm create-or-update -g %s -n %s --parameter-file %s --json', groupName, vm2Prefix, pvmParamFileName2).split(' ');
                                            testUtils.executeCommand(suite, retry, cmd, function(result) {
                                              result.exitStatus.should.equal(0);
                                              result.text.should.not.containEql('blob');
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
                  });
                });
              });
            });
          });
        });
      });

      it('vm 2nd delete command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('vm delete --resource-group %s --name %s -q --json', groupName, vm2Prefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      
      it('availset delete command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('availset delete --resource-group %s --name %s -q --json', groupName, avsPrefix7).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

    });
  });
});
