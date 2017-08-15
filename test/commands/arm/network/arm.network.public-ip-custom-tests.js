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
var util = require('util');
var _ = require('underscore');
var fs = require('fs');

var CLITest = require('../../../framework/arm-cli-test');
var utils = require('../../../../lib/util/utils');
var tagUtils = require('../../../../lib/commands/arm/tag/tagUtils');
var testUtils = require('../../../util/util');

var networkTestUtil = new (require('../../../util/networkTestUtil'))();
var vmTestUtil = new (require('../../../util/vmTestUtil'))();

var generatorUtils = require('../../../../lib/util/generatorUtils');
var profile = require('../../../../lib/util/profile');
var $ = utils.getLocaleString;

var testPrefix = 'arm-network-public-ip-custom-tests',
  groupName = 'xplat-test-public-ip-custom',
  location,
  vmssParams;

var publicIPAddresses = {
  publicIPAllocationMethod: 'Static',
  publicIPAddressVersion: 'IPv4',
  domainNameLabel: 'labelcreate',
  idleTimeoutInMinutes: 15,
  location: 'southeastasia',
  virtualmachineIndex: '0',
  networkInterfaceName: 'test',
  ipConfigurationName: 'test',
  publicIpAddressName: 'xplattestip',
  name: 'publicIPAddressName'
};

publicIPAddresses.virtualNetworkName = 'virtualNetworkName';
publicIPAddresses.subnetName = 'subnetName';
publicIPAddresses.networkSecurityGroupName = 'networkSecurityGroupName';

var subnet = {
  name: 'subnetName',
  addressPrefix: '10.0.0.0/16'
};
var virtualNetwork = {
  name: 'virtualNetworkName',
  location: 'southeastasia'
};
var networkSecurityGroup = {
  name: 'networkSecurityGroupName',
  location: 'southeastasia'
};
var vmTestUtilCreateVMSSWithParamFile = {
  vmssName: 'publicIPAddressName',
  paramFile: 'test/data/vmssParamTestPublicIp.json',
  storageAccount: 'xplatteststorage1',
  storageCont: 'xplatteststoragecnt1',
  publicIpName: 'xplattestip',
  domainNameLabel: 'vmssiplabel',
  idleTimeout: '30',
  nicDnsServer: '10.11.12.13'
};

var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'southeastasia'
}];

describe('arm', function () {
  describe('network', function () {
    var suite, retry = 5;
    var hour = 60 * 60000;
    var testTimeout = hour;

    before(function (done) {
      this.timeout(testTimeout);
      suite = new CLITest(this, testPrefix, requiredEnvironment);
      suite.setupSuite(function () {
        location = publicIPAddresses.location || process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);
        
        publicIPAddresses.location = location;
        publicIPAddresses.group = groupName;
        publicIPAddresses.name = suite.isMocked ? publicIPAddresses.name : suite.generateId(publicIPAddresses.name, null);

        vmssParams = JSON.parse(fs.readFileSync(vmTestUtilCreateVMSSWithParamFile.paramFile));

        if (!suite.isPlayback()) {
          networkTestUtil.createGroup(groupName, location, suite, function () {
            var cmd = 'network vnet create -g {1} -n {name} --location {location} --json'.formatArgs(virtualNetwork, groupName);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              var output = JSON.parse(result.text);
              publicIPAddresses.virtualNetworkId = output.id;

              var cmd = 'network vnet subnet create -g {1} -n {name} --address-prefix {addressPrefix} --vnet-name virtualNetworkName --json'.formatArgs(subnet, groupName);
              testUtils.executeCommand(suite, retry, cmd, function (result) {
                result.exitStatus.should.equal(0);
                var output = JSON.parse(result.text);
                publicIPAddresses.subnetId = output.id;

                var cmd = 'network nsg create -g {1} -n {name} --location {location} --json'.formatArgs(networkSecurityGroup, groupName);
                testUtils.executeCommand(suite, retry, cmd, function (result) {
                  result.exitStatus.should.equal(0);
                  var output = JSON.parse(result.text);
                  publicIPAddresses.networkSecurityGroupId = output.id;
                  done();
                });
              });
            });
          });
        } else {
          var subscriptionId = profile.current.getSubscription().id;
          publicIPAddresses.virtualNetworkId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'virtualNetworks', virtualNetwork.name);
          publicIPAddresses.subnetId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'virtualNetworks/' + virtualNetwork.name + '/subnets', subnet.name);
          publicIPAddresses.networkSecurityGroupId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'networkSecurityGroups', networkSecurityGroup.name);
          done();
        }
      });
    });
    after(function (done) {
      this.timeout(testTimeout);
      networkTestUtil.deleteGroup(groupName, suite, function () {
        suite.teardownSuite(done);
      });
    });
    beforeEach(function (done) {
      suite.setupTest(done);
    });
    afterEach(function (done) {
      suite.teardownTest(done);
    });

    describe('public ip addresses custom', function () {
      this.timeout(testTimeout);

      it('create should create public ip addresses', function (done) {
        var cmd = ('network public-ip create -g {group} -n {name} --allocation-method {publicIPAllocationMethod} ' +
          '--ip-version {publicIPAddressVersion} --domain-name-label {domainNameLabel} ' +
          '--idle-timeout {idleTimeoutInMinutes} --location {location} --json').formatArgs(publicIPAddresses);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.name.should.equal(publicIPAddresses.name);
          output.publicIPAllocationMethod.toLowerCase().should.equal(publicIPAddresses.publicIPAllocationMethod.toLowerCase());
          output.publicIPAddressVersion.toLowerCase().should.equal(publicIPAddresses.publicIPAddressVersion.toLowerCase());
          output.dnsSettings.domainNameLabel.toLowerCase().should.equal(publicIPAddresses.domainNameLabel.toLowerCase());
          output.idleTimeoutInMinutes.should.equal(publicIPAddresses.idleTimeoutInMinutes);

          done();
        });
      });

      it('show should display public ip addresses details', function (done) {
        var cmd = 'network public-ip show -g {group} -n {name} --json'.formatArgs(publicIPAddresses);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.name.should.equal(publicIPAddresses.name);
          output.publicIPAllocationMethod.toLowerCase().should.equal(publicIPAddresses.publicIPAllocationMethod.toLowerCase());
          output.publicIPAddressVersion.toLowerCase().should.equal(publicIPAddresses.publicIPAddressVersion.toLowerCase());
          output.dnsSettings.domainNameLabel.toLowerCase().should.equal(publicIPAddresses.domainNameLabel.toLowerCase());
          output.idleTimeoutInMinutes.should.equal(publicIPAddresses.idleTimeoutInMinutes);

          done();
        });
      });

      it('list should display all public ip addresses in resource group', function (done) {
        var cmd = 'network public-ip list -g {group} --json'.formatArgs(publicIPAddresses);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var outputs = JSON.parse(result.text);

          _.some(outputs, function (output) {
            return output.name === publicIPAddresses.name;
          }).should.be.true;

          done();
        });
      });

      it('delete should delete public ip addresses', function (done) {
        var cmd = 'network public-ip delete -g {group} -n {name} --quiet --json'.formatArgs(publicIPAddresses);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network public-ip show -g {group} -n {name} --json'.formatArgs(publicIPAddresses);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text || '{}');
            output.should.be.empty;
            done();
          });
        });
      });

      it('create vmss should create virtual machine scale set', function (done) {
        vmTestUtil.createVMSSWithParamFile(publicIPAddresses, vmTestUtilCreateVMSSWithParamFile, groupName, suite, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('show vmss should display public ip address in vmss', function (done) {
        var cmd = ('network public-ip show -g {group} -n {publicIpAddressName} ' +
          '--vmss-name {name} --vm-index {virtualmachineIndex} --nic-name {networkInterfaceName} ' +
          '--ip-config-name {ipConfigurationName} --json').formatArgs(publicIPAddresses);
         testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.name.should.equal(vmTestUtilCreateVMSSWithParamFile.publicIpName);
          output.dnsSettings.should.not.be.empty;
          output.dnsSettings.domainNameLabel.should.containEql(vmTestUtilCreateVMSSWithParamFile.domainNameLabel);

          done();
        });
      });

      it('list vmss should display all public ip addresses in vmss', function (done) {
        var cmd = ('network public-ip list -g {group} --vmss-name {name} --json').formatArgs(publicIPAddresses);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.length.should.be.equal(vmssParams.sku.capacity);

          _.some(output, function (publicIpAddress) {
            return publicIpAddress.name === vmTestUtilCreateVMSSWithParamFile.publicIpName;
          }).should.be.true;

          done();
        });
      });

      it('list vmss index should display all public ip addresses in vmss index', function (done) {
        var cmd = ('network public-ip list -g {group} --vmss-name {name} ' +
          '--vm-index {virtualmachineIndex} --nic-name {networkInterfaceName} ' +
          '--ip-config-name {ipConfigurationName} --json').formatArgs(publicIPAddresses);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          _.some(output, function (publicIpAddress) {
            return publicIpAddress.name === vmTestUtilCreateVMSSWithParamFile.publicIpName;
          }).should.be.true;

          done();
        });
      });
    });
  });
});
