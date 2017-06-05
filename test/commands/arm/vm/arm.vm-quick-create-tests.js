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
var testUtils = require('../../../util/util');
var CLITest = require('../../../framework/arm-cli-test');
var testprefix = 'arm-cli-vm-quick-create-tests';
var groupPrefix = 'xplatTestVMQCreate';
var VMTestUtil = require('../../../util/vmTestUtil');
var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'westus'
}, {
  name: 'SSHCERT',
  defaultValue: 'test/myCert.pem'
}];

var customDataFile = './test/data/customdata.txt';
var groupName,
  vm1Prefix = 'vm1',
  vm2Prefix = 'vm2',
  vm3Prefix = 'vm3',
  vm4Prefix = 'vm4',
  vm5Prefix = 'vm5',
  stgPrefix = 'stg',
  location,
  username = 'azureuser',
  password = 'Brillio@2016',
  vmSize,
  sshcert;

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
        vm3Prefix = suite.generateId(vm3Prefix, null);
        vm4Prefix = suite.generateId(vm4Prefix, null);
        vm5Prefix = suite.generateId(vm5Prefix, null);
        stgPrefix = suite.generateId(stgPrefix, null);
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

    describe('vm', function() {

      it('quick create with non-existing group should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.getVMSize(location, suite, function() {
          vmSize = VMTestUtil.vmSize;
          vmTest.checkImagefile(function() {
            if (VMTestUtil.linuxImageUrn === '' || VMTestUtil.linuxImageUrn === undefined) {
              vmTest.GetLinuxSkusList(location, suite, function(result) {
                vmTest.GetLinuxImageList(location, suite, function(result) {
                  var latestLinuxImageUrn = 'UbuntuLTS';
                  var cmd = util.format('vm quick-create %s %s %s Linux %s %s %s -M %s -z %s -w %s -C %s',
                    groupName, vm1Prefix, location, latestLinuxImageUrn, username, password, sshcert, vmSize, vm1Prefix + '-pip', customDataFile).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    result.text.should.containEql(vm1Prefix + '-pip.' + location.toLowerCase() + '.cloudapp.azure.com');
                    done();
                  });
                });
              });
            }
            else {
              var latestLinuxImageUrn = 'UbuntuLTS';
              var cmd = util.format('vm quick-create %s %s %s Linux %s %s %s -M %s -z %s -w %s -C %s',
                groupName, vm1Prefix, location, latestLinuxImageUrn, username, password, sshcert, vmSize, vm1Prefix + '-pip', customDataFile).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                result.text.should.containEql(vm1Prefix + '-pip.' + location.toLowerCase() + '.cloudapp.azure.com');
                done();
              });
            }
          });
        });
      });

      it('vm secret random add should fail', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm secret add %s %s %s -c c -t t', groupName, vm1Prefix, vm1Prefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.not.equal(0);
          should(result.errorText.indexOf('Property id \'' + vm1Prefix + '\' at path \'properties.osProfile.secrets') > -1).ok;
          done();
        });
      });

      it('vm secret random delete should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm secret delete %s %s %s -c %s', groupName, vm1Prefix, vm1Prefix, groupName).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('redeploy vm should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm redeploy %s %s', groupName, vm1Prefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          if (result.exitStatus !== 0) {
            result.text.should.containEql('redeployment failed due to an internal error. Please retry later.');
          }
          done();
        });
      });

      it('quick create with existing group should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.checkImagefile(function() {
          var latestWindowsImageUrn = '';
          if (VMTestUtil.winImageUrn === '' || VMTestUtil.winImageUrn === undefined) {
            vmTest.GetWindowsSkusList(location, suite, function(result) {
              vmTest.GetWindowsImageList(location, suite, function(result) {
                vmTest.setGroup(groupName, suite, function(result) {
                  var latestWindowsImageUrn = VMTestUtil.winImageUrn.substring(0, VMTestUtil.winImageUrn.lastIndexOf(':')) + ':latest';
                  var cmd = util.format('vm quick-create %s %s %s Windows %s %s %s',
                    groupName, vm2Prefix, location, latestWindowsImageUrn, username, password).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    result.text.should.containEql('-pip.' + location.toLowerCase() + '.cloudapp.azure.com');
                    done();
                  });
                });
              });
            });
          }
          else {
            vmTest.setGroup(groupName, suite, function(result) {
              var latestWindowsImageUrn = VMTestUtil.winImageUrn.substring(0, VMTestUtil.winImageUrn.lastIndexOf(':')) + ':latest';
              var cmd = util.format('vm quick-create %s %s %s Windows %s %s %s',
                groupName, vm2Prefix, location, latestWindowsImageUrn, username, password).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                result.text.should.containEql('-pip.' + location.toLowerCase() + '.cloudapp.azure.com');
                done();
              });
            });
          }
        });
      });

      it('quick-create with non-existing provided storage account name should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.getVMSize(location, suite, function() {
          vmSize = VMTestUtil.vmSize;
          vmTest.checkImagefile(function() {
            var cmd = util.format('vm quick-create %s %s %s Linux %s %s %s -M %s -z %s -w %s -C %s -t %s',
              groupName, vm3Prefix, location, 'UbuntuLTS', username, password, sshcert, vmSize, vm3Prefix + '-pip', customDataFile, stgPrefix).split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              result.text.should.containEql(vm3Prefix + '-pip.' + location.toLowerCase() + '.cloudapp.azure.com');
              done();
            });
          });
        });
      });

      it('quick-create with user image in matching storage but missing vhd should fail', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var bogusImageUrn = util.format('https://%s.blob.core.windows.net/bar/vhds/baz.vhd', stgPrefix);
        var cmd = util.format('vm quick-create %s %s %s Linux %s %s %s -M %s -z %s -w %s -C %s --storage-account-name %s',
          groupName, vm4Prefix, location, bogusImageUrn, username, password, sshcert, vmSize, vm4Prefix + '-pip', customDataFile, stgPrefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.not.equal(0);
          should(result.errorText.indexOf('Unable to find VHD blob with URI') > -1).ok;
          done();
        });
      });

      it('quick-create with user image on mismatched storage account should fail', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var bogusImageUrn = 'https://foo.blob.core.windows.net/bar/vhds/baz.vhd';
        var cmd = util.format('vm quick-create %s %s %s Linux %s %s %s -M %s -z %s -w %s -C %s',
          groupName, vm5Prefix, location, bogusImageUrn, username, password, sshcert, vmSize, vm5Prefix + '-pip', customDataFile).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.not.equal(0);
          should(result.errorText.indexOf('Source and destination storage accounts for disk') > -1).ok;
          should(result.errorText.indexOf('are different') > -1).ok;
          done();
        });
      });

    });
  });
});