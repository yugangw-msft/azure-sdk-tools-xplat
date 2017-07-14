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

var testPrefix = 'arm-network-nic-custom-tests',
  groupName = 'xplat-test-nic-custom',
  location,
  poolName = 'test-pool',
  inboundRuleName = 'test-inbound-rule',
  protocol = 'tcp',
  frontendPort = '90',
  backendPort = '90',
  vmssParams;

var networkInterfaces = {
  group: groupName,
  name: 'test-nic',
  privateIPAddress: '10.0.0.22',
  newPrivateIPAddress: '10.0.0.25',
  privateIPAddressVersion: 'IPv4',
  newPrivateIPAddressVersion: 'IPv6',
  internalDnsNameLabel: 'internal-dns-foo',
  newInternalDnsNameLabel: 'internal-dns-bar',
  ipConfigName: 'another-ip-config',
  enableIpForwarding: false,
  newEnableIpForwarding: true,
  tags: networkTestUtil.tags,
  newTags: networkTestUtil.newTags,
  attachedVMName: 'tempXplatVMForNicTests',
  attachedVMStorageAccount: 'xplateffectiveaccount',

  location: 'southeastasia',
  virtualmachineIndex: '0',
  networkInterfaceName: 'test',
  ipConfigurationName: 'test',
  vmssName: 'nicVmssName'
};

networkInterfaces.virtualNetworkName = 'test-vnet';
networkInterfaces.subnetName = 'test-subnet';
networkInterfaces.networkSecurityGroupName = 'networkSecurityGroupName';

var virtualNetwork = {
  name: 'test-vnet',
  location: 'southeastasia'
};
var subnet = {
  name: 'test-subnet',
  addressPrefix: '10.0.0.0/16',
  virtualNetworkName: 'test-vnet'
};
var networkSecurityGroup = {
  name: 'networkSecurityGroupName',
  location: 'southeastasia'
};
var vmTestUtilCreateVMSSWithParamFile = {
  vmssName: 'nicVmssName',
  paramFile: 'test/data/vmssParamTestNIC.json',
  storageAccount: 'xplatteststorage1',
  storageCont: 'xplatteststoragecnt1',
  publicIpName: 'xplattestip',
  domainNameLabel: 'vmssiplabel',
  idleTimeout: '30',
  nicDnsServer: '10.11.12.13'
};

var ipConfigProp1 = {
  name: 'config01'
};
var ipConfigProp2 = {
  name: 'config02',
  privateIPAddress: '10.0.0.26',
  isPrimary: true
};
var publicIpProp = {
  name: 'test-ip',
  domainName: 'foo-domain-test',
  allocationMethod: 'Static',
  ipVersion: 'IPv4',
  idleTimeout: 4,
  tags: networkTestUtil.tags
};
var lbProp = {
  name: 'test-lb',
  fipName: 'test-fip',
  publicIpProp: {
    name: 'test-fip-ip',
    domainName: 'baz-domain-test',
    allocationMethod: 'Dynamic',
    ipVersion: 'IPv4',
    idleTimeout: 4,
    tags: networkTestUtil.tags
  }
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
        location = networkInterfaces.location || process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);

        networkInterfaces.location = location;
        networkInterfaces.group = groupName;
        networkInterfaces.name = suite.isMocked ? networkInterfaces.name : suite.generateId(networkInterfaces.name, null);

        ipConfigProp1.group = groupName;
        ipConfigProp1.nicName = networkInterfaces.name;

        ipConfigProp2.group = groupName;
        ipConfigProp2.nicName = networkInterfaces.name;
        ipConfigProp2.vnetName = networkInterfaces.virtualNetworkName;
        ipConfigProp2.subnetName = networkInterfaces.subnetName;

        publicIpProp.location = location;
        publicIpProp.group = groupName;
        publicIpProp.name = suite.isMocked ? publicIpProp.name : suite.generateId(publicIpProp.name, null);

        lbProp.location = location;
        lbProp.group = groupName;
        lbProp.name = suite.isMocked ? lbProp.name : suite.generateId(lbProp.name, null);
        lbProp.publicIpProp.location = location;
        lbProp.publicIpProp.group = groupName;

        poolName = suite.isMocked ? poolName : suite.generateId(poolName, null);
        inboundRuleName = suite.isMocked ? inboundRuleName : suite.generateId(inboundRuleName, null);

        vmssParams = JSON.parse(fs.readFileSync(vmTestUtilCreateVMSSWithParamFile.paramFile));

        if (!suite.isPlayback()) {
          networkTestUtil.createGroup(groupName, location, suite, function () {
            var cmd = 'network vnet create -g {1} -n {name} --location {location} --json'.formatArgs(virtualNetwork, groupName);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              var output = JSON.parse(result.text);
              networkInterfaces.virtualNetworkId = output.id;

              var cmd = 'network vnet subnet create -g {1} -n {name} --address-prefix {addressPrefix} --vnet-name {virtualNetworkName} --json'.formatArgs(subnet, groupName);
              testUtils.executeCommand(suite, retry, cmd, function (result) {
                result.exitStatus.should.equal(0);
                var output = JSON.parse(result.text);
                networkInterfaces.subnetId = output.id;

                var cmd = 'network nsg create -g {1} -n {name} --location {location} --json'.formatArgs(networkSecurityGroup, groupName);
                testUtils.executeCommand(suite, retry, cmd, function (result) {
                  result.exitStatus.should.equal(0);
                  var output = JSON.parse(result.text);
                  networkInterfaces.networkSecurityGroupId = output.id;

                  networkTestUtil.createPublicIp(publicIpProp, suite, function (publicIp) {
                    networkInterfaces.publicIPAddressId = publicIp.id;
                    done();
                  });
                });
              });
            });
          });
        } else {
          var subscriptionId = profile.current.getSubscription().id;
          networkInterfaces.virtualNetworkId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'virtualNetworks', virtualNetwork.name);
          networkInterfaces.subnetId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'virtualNetworks/' + virtualNetwork.name + '/subnets', subnet.name);
          networkInterfaces.networkSecurityGroupId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'networkSecurityGroups', networkSecurityGroup.name);
          networkInterfaces.publicIPAddressId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'publicIPAddresses', publicIpProp.name);
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

    describe('nic custom', function () {
      this.timeout(testTimeout);

      it('create should create nic with default ip configuration', function (done) {
        var cmd = ('network nic create -g {group} -n {name} -l {location} -a {privateIPAddress} -r {internalDnsNameLabel} ' +
          '-f {enableIpForwarding} -t {tags} -u {1} -i {2} --json').formatArgs(networkInterfaces, networkInterfaces.subnetId, networkInterfaces.publicIPAddressId);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.name.should.equal(networkInterfaces.name);
          output.enableIPForwarding.should.equal(networkInterfaces.enableIpForwarding);
          output.ipConfigurations.length.should.equal(1);
          output.dnsSettings.internalDnsNameLabel.should.equal(networkInterfaces.internalDnsNameLabel);

          var defaultIpConfig = output.ipConfigurations[0];
          defaultIpConfig.subnet.id.should.containEql(networkInterfaces.subnetName);
          defaultIpConfig.publicIPAddress.id.should.containEql(publicIpProp.name);
          defaultIpConfig.privateIPAddress.should.equal(networkInterfaces.privateIPAddress);

          networkTestUtil.shouldBeSucceeded(defaultIpConfig);
          networkTestUtil.shouldHaveTags(output);
          networkTestUtil.shouldBeSucceeded(output);
          done();
        });
      });

      it('show should display nic details', function (done) {
        var cmd = 'network nic show -g {group} -n {name} --json'.formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.name.should.equal(networkInterfaces.name);
          output.enableIPForwarding.should.equal(networkInterfaces.enableIpForwarding);
          output.dnsSettings.internalDnsNameLabel.should.equal(networkInterfaces.internalDnsNameLabel);
          output.ipConfigurations.length.should.equal(1);

          var defaultIpConfig = output.ipConfigurations[0];
          defaultIpConfig.subnet.id.should.containEql(networkInterfaces.subnetName);
          defaultIpConfig.publicIPAddress.id.should.containEql(publicIpProp.name);
          defaultIpConfig.privateIPAddress.should.equal(networkInterfaces.privateIPAddress);

          networkTestUtil.shouldBeSucceeded(defaultIpConfig);
          networkTestUtil.shouldHaveTags(output);
          networkTestUtil.shouldBeSucceeded(output);
          done();
        });
      });

      it('set should modify nic', function (done) {
        var cmd = ('network nic set -g {group} -n {name} -r {newInternalDnsNameLabel} -f {newEnableIpForwarding} ' +
          '-t {newTags} --json').formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.enableIPForwarding.should.equal(networkInterfaces.newEnableIpForwarding);
          output.dnsSettings.internalDnsNameLabel.should.equal(networkInterfaces.newInternalDnsNameLabel);

          networkTestUtil.shouldAppendTags(output);
          networkTestUtil.shouldBeSucceeded(output);
          done();
        });
      });

      it('effective-route-table and effective-nsg commands should work', function (done) {
        var cmd = 'network nic show -g {group} -n {name} --json'.formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);
          cmd = 'network nic effective-nsg list {group} {name} --json'.formatArgs(networkInterfaces);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.not.equal(0);
            cmd = 'network nic effective-route-table show {group} {name} --json'.formatArgs(networkInterfaces);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.not.equal(0);
              vmTestUtil.CreateVmWithNic(networkInterfaces.group, networkInterfaces.attachedVMName, location, 'Linux', 'Debian', output.name, 'xplatuser', 'Pa$$word1', networkInterfaces.attachedVMStorageAccount, suite, function(result) {
                cmd = 'network nic effective-nsg list {group} {name} --json'.formatArgs(networkInterfaces);
                testUtils.executeCommand(suite, retry, cmd, function (result) {
                  result.exitStatus.should.equal(0);
                  cmd = 'network nic effective-route-table show {group} {name} --json'.formatArgs(networkInterfaces);
                  testUtils.executeCommand(suite, retry, cmd, function (result) {
                    result.exitStatus.should.equal(0);
                    vmTestUtil.RemoveVm(networkInterfaces.group, networkInterfaces.attachedVMName, suite, function(result) {
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });

      it('ip-config create should should create another ip configuration', function (done) {
        var cmd = 'network nic ip-config create -g {group} -c {name} -n {ipConfigName} -b {newPrivateIPAddressVersion} --json'.formatArgs(networkInterfaces);

        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(2);

          var anotherIpConfig = output.ipConfigurations[1];
          anotherIpConfig.name.should.equal(networkInterfaces.ipConfigName);
          anotherIpConfig.privateIPAddressVersion.should.equal(networkInterfaces.newPrivateIPAddressVersion);

          networkTestUtil.shouldBeSucceeded(anotherIpConfig);
          networkTestUtil.shouldBeSucceeded(output);
          done();
        });
      });

      it('ip-config list should should list ip configurations in nic', function (done) {
        var cmd = 'network nic ip-config list -g {group} -c {name} --json'.formatArgs(networkInterfaces);

        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.length.should.equal(2);
          _.some(output, function (ipConfig) {
            return ipConfig.name === networkInterfaces.ipConfigName;
          }).should.be.true;

          done();
        });
      });

      it('ip-config show should display details of ip configuration', function (done) {
        var cmd = 'network nic ip-config show -g {group} -c {name} -n {ipConfigName} --json'.formatArgs(networkInterfaces);

        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.name.should.equal(networkInterfaces.ipConfigName);
          output.privateIPAddressVersion.should.equal(networkInterfaces.newPrivateIPAddressVersion);

          networkTestUtil.shouldBeSucceeded(output);
          done();
        });
      });

      it('ip-config delete should delete ip configuration', function (done) {
        var cmd = 'network nic ip-config delete -g {group} -c {name} -n {ipConfigName} --quiet --json'.formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network nic ip-config show -g {group} -c {name} -n {ipConfigName} --json'.formatArgs(networkInterfaces);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);
            output.should.be.empty;
            done();
          });
        });
      });

      it('ip-config set should attach address pool to ip configuration', function (done) {
        networkTestUtil.createLB(lbProp, suite, function () {
          networkTestUtil.createAddressPool(groupName, lbProp.name, poolName, suite, function (pool) {
            var cmd = 'network nic ip-config set -g {group} -c {name} -n default-ip-config -d {1} --json'.formatArgs(networkInterfaces, pool.id);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              var output = JSON.parse(result.text);

              var defaultIpConfig = output.ipConfigurations[0];
              var pools = defaultIpConfig.loadBalancerBackendAddressPools;
              pools.length.should.equal(1);
              pools[0].id.should.equal(pool.id);

              done();
            });
          });
        });
      });

      it('ip-config set should detach address pool from ip configuration', function (done) {
        var cmd = 'network nic ip-config set -g {group} -c {name} -n default-ip-config -d --json'.formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(1);
          output.ipConfigurations[0].should.not.have.property('loadBalancerBackendAddressPools');

          done();
        });
      });

      it('ip-config set should attach inbound nat rule to ip configuration', function (done) {
        networkTestUtil.createInboundNatRule(groupName, lbProp.name, inboundRuleName, protocol, frontendPort, backendPort, 'true', 10, lbProp.fipName, suite, function (natRule) {
          var cmd = 'network nic ip-config set -g {group} -c {name} -n default-ip-config -e {1} --json'.formatArgs(networkInterfaces, natRule.id);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);

            var rules = output.ipConfigurations[0].loadBalancerInboundNatRules;
            rules.length.should.equal(1);
            rules[0].id.should.equal(natRule.id);

            done();
          });
        });
      });

      it('ip-config set should detach inbound nat rule from ip configuration', function (done) {
        var cmd = 'network nic ip-config set -g {group} -c {name} -n default-ip-config -e --json'.formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(1);
          output.ipConfigurations[0].should.not.have.property('loadBalancerInboundNatRules');

          done();
        });
      });

      it('ip-config address-pool create should attach address pool to ip configuration', function (done) {
        var cmd = 'network nic ip-config address-pool create -g {group} -c {name} -n default-ip-config -l {1} -a {2} --json'.formatArgs(networkInterfaces, lbProp.name, poolName);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(1);
          var pools = output.ipConfigurations[0].loadBalancerBackendAddressPools;
          pools.length.should.equal(1);
          pools[0].id.should.containEql(poolName);

          done();
        });
      });

      it('ip-config address-pool delete should detach address-pool from ip configuration', function (done) {
        var cmd = 'network nic ip-config address-pool delete -g {group} -c {name} -n default-ip-config -l {1} -a {2} --json'.formatArgs(networkInterfaces, lbProp.name, poolName);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(1);
          output.ipConfigurations[0].should.not.have.property('loadBalancerBackendAddressPools');

          done();
        });
      });

      it('ip-config inbound-nat-rule create should attach inbound nat rule to ip configuration', function (done) {
        var cmd = 'network nic ip-config inbound-nat-rule create -g {group} -c {name} -n default-ip-config -l {1} -r {2} --json'.formatArgs(networkInterfaces, lbProp.name, inboundRuleName);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(1);
          var rules = output.ipConfigurations[0].loadBalancerInboundNatRules;
          rules.length.should.equal(1);
          rules[0].id.should.containEql(inboundRuleName);

          done();
        });
      });

      it('ip-config inbound-nat-rule delete should detach inbound nat rule from ip configuration', function (done) {
        var cmd = 'network nic ip-config inbound-nat-rule delete -g {group} -c {name} -n default-ip-config -l {1} -r {2} --json'.formatArgs(networkInterfaces, lbProp.name, inboundRuleName);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(1);
          output.ipConfigurations[0].should.not.have.property('loadBalancerInboundNatRules');

          done();
        });
      });

      it('ip-config set should detach public ip from ip configuration', function (done) {
        var cmd = 'network nic ip-config set -g {group} -c {name} -n default-ip-config --public-ip-name \'\' --json'.formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ipConfigurations.length.should.equal(1);
          output.ipConfigurations[0].should.not.have.property('publicIPAddress');

          done();
        });
      });

      it('ip-config create should create second ip configuration', function (done) {
        var cmd = 'network nic ip-config create -g {group} -c {nicName} -n {name} --json'.formatArgs(ipConfigProp1);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          var createdConfig = utils.findFirstCaseIgnore(output.ipConfigurations, {name: ipConfigProp1.name});
          createdConfig.should.not.be.empty;

          networkTestUtil.shouldBeSucceeded(createdConfig);
          done();
        });
      });

      it('ip-config create should create third ip configuration', function (done) {
        var cmd = 'network nic ip-config create -g {group} -c {nicName} -n {name} -m {vnetName} -k {subnetName} -y {isPrimary} -q --json'.formatArgs(ipConfigProp2);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          var createdConfig = utils.findFirstCaseIgnore(output.ipConfigurations, {name: ipConfigProp2.name});
          createdConfig.should.not.be.empty;
          createdConfig.primary.should.be.true;

          _.some(output.ipConfigurations, function (ipConfig) {
            return ipConfig.isPrimary === true && ipConfig.name === ipConfigProp2.name;
          }).should.be.false;

          networkTestUtil.shouldBeSucceeded(createdConfig);
          done();
        });
      });

      it('ip-config set should set second ip configuration as primary', function (done) {
        var cmd = 'network nic ip-config set -g {group} -c {nicName} -n {name} -y true --json'.formatArgs(ipConfigProp1);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          var primaryConfig = utils.findFirstCaseIgnore(output.ipConfigurations, {name: ipConfigProp1.name});
          primaryConfig.primary.should.be.true;

          done();
        });
      });

      it('ip-config delete should delete third ip configuration', function (done) {
        var cmd = 'network nic ip-config delete -g {group} -c {nicName} -n {name} -q --json'.formatArgs(ipConfigProp2);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          _.some(output.ipConfigurations, function (ipConfig) {
            return ipConfig.name === ipConfigProp2.name;
          }).should.be.false;
          
          done();
        });
      });

      it('delete should delete nic', function (done) {
        var cmd = 'network nic delete -g {group} -n {name} --quiet --json'.formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network nic show -g {group} -n {name} --json'.formatArgs(networkInterfaces);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);
            output.should.be.empty;
            done();
          });
        });
      });

      it('create vmss should create virtual machine scale set', function (done) {
        vmTestUtil.createVMSSWithParamFile(networkInterfaces, vmTestUtilCreateVMSSWithParamFile, groupName, suite, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('show vmss should display network interface in vmss', function (done) {
        var cmd = ('network nic show -g {group} -n {networkInterfaceName} ' +
          '--virtual-machine-scale-set-name {vmssName} ' +
          '--virtual-machine-index {virtualmachineIndex} --json').formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);
          output.name.should.equal(networkInterfaces.networkInterfaceName);
          done();
        });
      });

      it('list vmss should list all network interfaces in vmss', function (done) {
        var cmd = ('network nic list -g {group} --virtual-machine-scale-set-name {vmssName} ' +
          '--virtual-machine-index {virtualmachineIndex} --json').formatArgs(networkInterfaces);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          _.some(output, function (nic) {
            return nic.name === networkInterfaces.networkInterfaceName;
          }).should.be.true;

          done();
        });
      });
    });
  });
});