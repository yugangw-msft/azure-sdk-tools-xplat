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
var testprefix = 'arm-cli-diskvm-parameter-create-tests';
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
  vmId,
  subscriptionId,	
  avsPrefix8 = 'xplattestavs8',
  imgPrefix8A = 'xplattestimg8A',
  imgPrefix8 = 'xplattestimg8',
  vm1Prefix = 'vm1',
  location,
  username = 'azureuser',
  password = 'Brillio@2016',
  vmSize,
  sshcert,
  avsParamFileName = 'test/data/avs8Param.json',
  pvmParamFileName = 'test/data/pvm8Param.json',
  imgParamFileName = 'test/data/img8ParamA.json',
  imgCaptureParamFileName = 'test/data/img8Param.json',
  storageAccount = 'xplatteststorage1',
  nicName = 'xplattestnic',
  vNetPrefix = 'xplattestvnet',
  subnetName = 'xplattestsubnet',
  publicipName = 'xplattestip',
  dnsPrefix = 'xplattestipdns',
  osdiskvhd = 'xplattestvhd',
  osVhdUri = 'https://foo.blob.core.windows.net/bar/baz.vhd';
  
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
        avsPrefix8 = suite.generateId(avsPrefix8, null);
        nicName = suite.generateId(nicName, null);
        storageAccount = suite.generateId(storageAccount, null);
        subscriptionId = profile.current.getSubscription().id;
        vmId = '/subscriptions/'+ subscriptionId +'/resourceGroups/' + groupName + '/providers/Microsoft.Compute/virtualmachines/' + vm1Prefix;
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

    describe('disk-vm', function() {

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
                    done();
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
                var cmd = makeCommandStr('availset', 'sku', 'set', avsParamFileName, util.format('--name %s', 'Classic')).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeCommandStr('availset', 'availability-set', 'set', avsParamFileName, util.format('--name %s --location %s', avsPrefix8, location)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = util.format('availset create-or-update -g %s -n %s --parameter-file %s', groupName, avsPrefix8, avsParamFileName).split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      result.text.should.containEql('Classic');
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
        var avsetId = '/subscriptions/' + subscription.id + '/resourceGroups/' + groupName + '/providers/Microsoft.Compute/availabilitySets/' + avsPrefix8;
        osVhdUri = util.format('https://%s.blob.core.windows.net/%s/%s.vhd', storageAccount, vm1Prefix, osdiskvhd);
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
                                  var cmd = makeCommandStr('vm', 'os-disk', 'set', pvmParamFileName, '--caching None --create-option fromImage --name test').split(' ');
                                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                                    result.exitStatus.should.equal(0);
                                    var cmd = makeCommandStr('vm', 'os-disk', 'delete', pvmParamFileName, '--os-type --image --encryption-settings --managed-disk').split(' ');
                                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                                      result.exitStatus.should.equal(0);
                                      var cmd = makeCommandStr('vm', 'vhd', 'set', pvmParamFileName, util.format('--uri %s', osVhdUri)).split(' ');
                                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                                        result.exitStatus.should.equal(0);
                                        var cmd = makeCommandStr('vm', 'network-interfaces', 'set', pvmParamFileName, util.format('--index 0 --id %s', nicId)).split(' ');
                                        testUtils.executeCommand(suite, retry, cmd, function(result) {
                                          result.exitStatus.should.equal(0);
                                          var cmd = util.format('vm create-or-update -g %s -n %s --parameter-file %s --json', groupName, vm1Prefix, pvmParamFileName).split(' ');
                                          testUtils.executeCommand(suite, retry, cmd, function(result) {
                                            result.exitStatus.should.equal(0);
                                            result.text.should.containEql('blob');
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

      it('managed-image create should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('managed-image config create --parameter-file %s', imgParamFileName).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          var cmd = makeCommandStr('managed-image', 'image', 'delete', imgParamFileName, '--tags --type --name --id --source-virtual-machine --provisioning-state').split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = makeCommandStr('managed-image', 'image', 'set', imgParamFileName, util.format('--location %s --name %s', location, imgPrefix8A)).split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeCommandStr('managed-image', 'os-disk', 'delete', imgParamFileName, '--managed-disk --snapshot').split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeCommandStr('managed-image', 'os-disk', 'set', imgParamFileName, util.format('--os-type %s --blob-uri %s --caching None --os-state Generalized', 'Linux', osVhdUri)).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeCommandStr('managed-image', 'data-disks', 'set', imgParamFileName, util.format('--blob-uri %s --caching None --index 0', osVhdUri)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = makeCommandStr('managed-image', 'data-disks', 'set', imgParamFileName, util.format('--lun %s --index 0 --parse', '1')).split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      var cmd = makeCommandStr('managed-image', 'data-disks', 'delete', imgParamFileName, util.format('--managed-disk --snapshot --index 0')).split(' ');
                      testUtils.executeCommand(suite, retry, cmd, function(result) {
                        result.exitStatus.should.equal(0);
                        var cmd = util.format('managed-image create -g %s -n %s --parameter-file %s --json', groupName, imgPrefix8A, imgParamFileName).split(' ');
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
      
      it('managed-image show and list command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('managed-image show %s %s exp --json', groupName, imgPrefix8A).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.text.should.containEql(groupName);
          result.text.should.containEql(imgPrefix8A);
          result.text.should.containEql(osVhdUri);
          result.exitStatus.should.equal(0);
          var cmd = util.format('managed-image list --json').split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            result.text.should.containEql(imgPrefix8A);
            result.text.should.containEql(osVhdUri);
            done();
          });
        });
      });
      
      it('vm deallocate and generalize command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('vm deallocate --resource-group %s --name %s --json', groupName, vm1Prefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          var cmd = util.format('vm generalize --resource-group %s --name %s --json', groupName, vm1Prefix).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            done();
          });
        });
      });

      it('managed-image capture create should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.getVMSize(location, suite, function() {
          var cmd = util.format('managed-image config create --parameter-file %s', imgCaptureParamFileName).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = makeCommandStr('managed-image', 'image', 'delete', imgCaptureParamFileName, '--tags --type --name --id --storage-profile --provisioning-state').split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeCommandStr('managed-image', 'image', 'set', imgCaptureParamFileName, util.format('--location %s --name %s', location, imgPrefix8)).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeCommandStr('managed-image', 'source-virtual-machine', 'set', imgCaptureParamFileName, util.format('--id %s', vmId)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = util.format('managed-image create -g %s -n %s --parameter-file %s --json', groupName, imgPrefix8, imgCaptureParamFileName).split(' ');
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

      it('managed-image delete command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('managed-image delete --resource-group %s --name %s --json', groupName, imgPrefix8).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          done();
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
      
      it('availset delete command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('availset delete --resource-group %s --name %s -q --json', groupName, avsPrefix8).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

    });
  });
});
