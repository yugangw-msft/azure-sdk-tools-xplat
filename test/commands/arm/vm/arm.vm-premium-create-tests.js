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
var testprefix = 'arm-cli-vm-premium-create-tests';
var groupPrefix = 'xplatTestZVMCreate';
var availprefix = 'xplatTestZVMAvail';
var VMTestUtil = require('../../../util/vmTestUtil');
var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'eastus2'
}, {
  name: 'SSHCERT',
  defaultValue: 'test/myCert.pem'
}];

var groupName,
  vmPrefix = 'xplatvm',
  vm2Prefix = 'xplatvm2',
  vm3Prefix = 'xplatvm3',
  vm4Prefix = 'xplatvm4',
  nicName = 'xplattestnic',
  nic2Name = 'xplattestnic2',
  location,
  username = 'azureuser',
  password = 'Brillio@2015',
  storageAccount = 'xplatteststorage1',
  storageCont = 'xplatteststoragecnt1',
  osdiskvhd = 'xplattestvhd',
  vNetPrefix = 'xplattestvnet',
  subnetName = 'xplattestsubnet',
  publicipName = 'xplattestip',
  publicip2Name = 'xplattestip2',
  dnsPrefix = 'xplattestipdns',
  dns2Prefix = 'xplattestipdns2',
  tags = 'a=b;b=c;d=',
  sshcert,
  IaasDiagPublisher,
  IaasDiagExtName,
  IaasDiagVersion,
  datafile = 'test/data/testdata.json',
  latestLinuxImageUrn = null,
  storageType = 'PLRS',
  vmSize = 'Standard_DS1';

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
        availprefix = suite.generateId(availprefix, null);
        vmPrefix = suite.isMocked ? vmPrefix : suite.generateId(vmPrefix, null);
        vm2Prefix = suite.isMocked ? vm2Prefix : suite.generateId(vm2Prefix, null);
        vm3Prefix = suite.isMocked ? vm3Prefix : suite.generateId(vm3Prefix, null);
        nicName = suite.isMocked ? nicName : suite.generateId(nicName, null);
        nic2Name = suite.isMocked ? nic2Name : suite.generateId(nic2Name, null);
        storageAccount = suite.generateId(storageAccount, null);
        storageCont = suite.generateId(storageCont, null);
        osdiskvhd = suite.isMocked ? osdiskvhd : suite.generateId(osdiskvhd, null);
        vNetPrefix = suite.isMocked ? vNetPrefix : suite.generateId(vNetPrefix, null);
        subnetName = suite.isMocked ? subnetName : suite.generateId(subnetName, null);
        publicipName = suite.isMocked ? publicipName : suite.generateId(publicipName, null);
        publicip2Name = suite.isMocked ? publicip2Name : suite.generateId(publicip2Name, null);
        dnsPrefix = suite.generateId(dnsPrefix, null);
        dns2Prefix = suite.generateId(dns2Prefix, null);
        tags = 'a=b;b=c;d=';

        // Get real values from test/data/testdata.json file and assign to the local variables
        var data = fs.readFileSync(datafile, 'utf8');
        var variables = JSON.parse(data);
        IaasDiagPublisher = variables.IaasDiagPublisher_Linux.value;
        IaasDiagExtName = variables.IaasDiagExtName_Linux.value;
        IaasDiagVersion = variables.IaasDiagVersion_Linux.value;
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

      it('create premium storage account should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.createGroup(groupName, location, suite, function(result) {
          var cmd = util.format('storage account create %s -g %s --location %s --sku-name %s --kind Storage --json', storageAccount, groupName, location, storageType).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            done();
          });
        });
      });

      it('create with premium storage should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.checkImagefile(function() {
          var cmd = util.format('availset create %s %s %s  --json', groupName, availprefix, location).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            if (VMTestUtil.linuxImageUrn === '' || VMTestUtil.linuxImageUrn === undefined) {
              vmTest.GetLinuxSkusList(location, suite, function(result) {
                vmTest.GetLinuxImageList(location, suite, function(result) {
                  latestLinuxImageUrn = VMTestUtil.linuxImageUrn.substring(0, VMTestUtil.linuxImageUrn.lastIndexOf(':')) + ':latest';
                  var cmd = util.format('vm create %s %s %s Linux -f %s -Q %s -u %s -p %s -o %s -R %s -F %s -P %s -j %s -k %s -i %s -w %s -M %s --tags %s -r %s -z %s --json',
                    groupName, vmPrefix, location, nicName, latestLinuxImageUrn, username, password, storageAccount, storageCont,
                    vNetPrefix, '10.0.0.0/16', subnetName, '10.0.0.0/24', publicipName, dnsPrefix, sshcert, tags, availprefix, vmSize).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    done();
                  });
                });
              });
            } else {
              latestLinuxImageUrn = VMTestUtil.linuxImageUrn.substring(0, VMTestUtil.linuxImageUrn.lastIndexOf(':')) + ':latest';
              var cmd = util.format('vm create %s %s %s Linux -f %s -Q %s -u %s -p %s -o %s -R %s -F %s -P %s -j %s -k %s -i %s -w %s -M %s --tags %s -r %s -z %s --json',
                groupName, vmPrefix, location, nicName, latestLinuxImageUrn, username, password, storageAccount, storageCont,
                vNetPrefix, '10.0.0.0/16', subnetName, '10.0.0.0/24', publicipName, dnsPrefix, sshcert, tags, availprefix, vmSize).split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                done();
              });
            }
          });
        });
      });
      
      it('list should display all premium VMs in resource group', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm list %s --json', groupName).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          var allResources = JSON.parse(result.text);
          allResources.some(function(res) {
            return res.name === vmPrefix;
          }).should.be.true;
          allResources.some(function(res) {
            return res.resourceGroupName === groupName;
          }).should.be.true;
          done();
        });
      });

      it('list all should display all premium VMs in subscription', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm list %s --json', '').split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          var allResources = JSON.parse(result.text);
          allResources.some(function(res) {
            return res.name === vmPrefix;
          }).should.be.true;
          done();
        });
      });

      it('show should display details about premium VM', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm show %s %s --json', groupName, vmPrefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          var allResources = JSON.parse(result.text);
          allResources.name.should.equal(vmPrefix);
          allResources.availabilitySet.id.toLowerCase().should.containEql(availprefix.toLowerCase());
          var cmd = util.format('vm show %s %s', groupName, vmPrefix).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            result.text.should.containEql(dnsPrefix + '.' + location.toLowerCase() + '.cloudapp.azure.com');
            var cmd = util.format('availset show %s %s --json', groupName, availprefix).split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var avSetResult = JSON.parse(result.text);
              avSetResult.name.should.equal(availprefix);
              avSetResult.virtualMachines[0].id.toLowerCase().should.containEql(vmPrefix.toLowerCase());
              done();
            });
          });
        });
      });

      it('get-instance-view should get instance view of the premium VM', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm get-instance-view %s %s --json', groupName, vmPrefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          should(result.text.indexOf('diagnosticsProfile') > -1).ok;
          should(result.text.indexOf('bootDiagnostics') > -1).ok;
          should(result.text.indexOf('"storageUri": "https://') > -1).ok;
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('get-serial-output should get serial output of the premium VM', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        var cmd = util.format('vm get-serial-output %s %s', groupName, vmPrefix).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          should(result.text.indexOf('bootdiagnostics') > -1 || result.text.indexOf('bootDiagnostics') > -1).ok;
          should(result.text.indexOf('serialconsole.log') > -1).ok;
          result.exitStatus.should.equal(0);
          done();
        });
      });

    });
  });
});