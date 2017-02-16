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

var testUtils = require('../../../util/util');
var CLITest = require('../../../framework/arm-cli-test');
var utils = require('../../../../lib/util/utils');
var NetworkTestUtil = require('../../../util/networkTestUtil');
var tagUtils = require('../../../../lib/commands/arm/tag/tagUtils');
var networkUtil = new NetworkTestUtil();
var VMTestUtil = require('../../../util/vmTestUtil');
var vmUtil = new VMTestUtil();
var envUtil = require('../../../util/preinstalledEnv.js');

var generatorUtils = require('../../../../lib/util/generatorUtils');
var profile = require('../../../../lib/util/profile');
var $ = utils.getLocaleString;

var testPrefix = 'arm-network-networkwatchers-tests',
  groupName = 'xplat-test-watcher',
  location;
var index = 0;

var networkWatchers = {
  location: 'westcentralus',
  name: 'networkWatchersName',
  vmName: 'TestVMWatcher',
  vmStorageAccount: 'watcherteststorageacc',
  nicName: 'testNicForCapture',
  vnetName: 'testVnetForCapture',
  vnetPrefixes: '10.0.0.0/8',
  subnetName: 'testSubnetForCapture',
  subnetPrefix: '10.0.0.0/16',
  pipName: 'publicIpForCapture',
  nsgName: 'nsgForCapture',

  remoteIpAddress: '10.0.0.17',
  localPort: '80',
  remotePort: '80',
  direction: 'Inbound',
  protocol: 'UDP',
  sourceIpAddress: '10.0.0.5',
  destinationIpAddress: '10.0.0.13',
  rgTopology: 'xplat-rg-topology',
  storageName: 'troubleshootteststorage',
  blobName: 'troubleshootblobname',
  enabled: 'true',
  retentionPolicyEnabled: 'true',
  days: '123',
}

var vpnGateway = {
  name: 'troubleshootVpn',
  vnetName: 'vpnVnet',
  subnetName: 'GatewaySubnet',
  publicIpName: 'vpnIp',
  vnetAddressPrefix: '10.0.0.0/8',
  subnetAddressPrefix: '10.0.0.0/16',
  enableBgp: true,
  bgpSettingsAsn: 10,
  bgpPeeringAddress: '10.0.0.17',
  bgpPeerWeight: 20,
  vpnType: 'RouteBased',
  gatewayType: 'Vpn',
  sku: 'Standard',
  tags: networkUtil.tags
}

var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'westus'
}];

describe('arm', function () {
  describe('network', function () {
    var suite, retry = 5;
    var hour = 60 * 60000;

    before(function (done) {
      suite = new CLITest(this, testPrefix, requiredEnvironment);
      suite.setupSuite(function () {
        location = networkWatchers.location || process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);
        networkWatchers.location = location;
        vpnGateway.location = location;
        networkWatchers.group = groupName;
        vpnGateway.group = groupName;
        networkWatchers.name = suite.isMocked ? networkWatchers.name : suite.generateId(networkWatchers.name, null);
        if(!suite.isPlayback()) {
          networkUtil.createGroup(groupName, location, suite, function () {
            envUtil.getNetworkWatcherEnv(groupName, location, networkWatchers.vnetName, networkWatchers.vnetPrefixes,
              networkWatchers.subnetName, networkWatchers.subnetPrefix,
              networkWatchers.pipName, networkWatchers.nsgName, networkWatchers.nicName,
              networkWatchers.vmName, networkWatchers.vmStorageAccount, vpnGateway,
              networkWatchers.rgTopology, networkWatchers.storageName, networkWatchers.blobName, suite, function() {
              var cmd = 'vm show -g {group} -n {vmName} --json'.formatArgs(networkWatchers);
              testUtils.executeCommand(suite, retry, cmd, function (result) {
                result.exitStatus.should.equal(0);
                var output = JSON.parse(result.text);
                networkWatchers.vmId = output.id;
                var cmd = 'storage account show --resource-group {group} {storageName} --json'.formatArgs(networkWatchers);
                testUtils.executeCommand(suite, retry, cmd, function (result) {
                  result.exitStatus.should.equal(0);
                  var output = JSON.parse(result.text);
                  networkWatchers.storageId = output.id;
                  var cmd = 'network nic show -g {group} -n {nicName} --json'.formatArgs(networkWatchers);
                  testUtils.executeCommand(suite, retry, cmd, function (result) {
                    result.exitStatus.should.equal(0);
                    var output = JSON.parse(result.text);
                    networkWatchers.nicId = output.id;
                    networkWatchers.localIpAddress = output.ipConfigurations[0].privateIPAddress;
                    var cmd = 'network vpn-gateway show -g {group} -n {name} --json'.formatArgs(vpnGateway);
                    testUtils.executeCommand(suite, retry, cmd, function (result) {
                      result.exitStatus.should.equal(0);
                      var output = JSON.parse(result.text);
                      networkWatchers.vpnId = output.id;
                      var cmd = util.format('network nsg show -g %s -n %s --json', groupName, networkWatchers.nsgName);
                      testUtils.executeCommand(suite, retry, cmd, function (result) {
                        result.exitStatus.should.equal(0);
                        var output = JSON.parse(result.text);
                        networkWatchers.nsgId = output.id;
                        done();
                      });
                    });
                  });
                });
              });
            });
          });
        } else {
          done();
        }
      });
    });
    after(function (done) {
      this.timeout(hour);
      networkUtil.deleteGroup(groupName, suite, function () {
        suite.teardownSuite(done);
      });
    });
    beforeEach(function (done) {
      suite.setupTest(done);
    });
    afterEach(function (done) {
      suite.teardownTest(done);
    });

    describe('network watchers', function () {
      this.timeout(hour);
      it('create should create network watchers', function (done) {
        var cmd = 'network watcher create -g {group} -n {name} --location {location}  --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);
          output.name.should.equal(networkWatchers.name);

          done();
        });
      });

      it('show should display network watchers details', function (done) {
        var cmd = 'network watcher show -g {group} -n {name} --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);
          output.name.should.equal(networkWatchers.name);

          done();
        });
      });
      it('list should display all network watchers in resource group', function (done) {
        var cmd = 'network watcher list -g {group} --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var outputs = JSON.parse(result.text);
          _.some(outputs, function (output) {
            return output.name === networkWatchers.name;
          }).should.be.true;
          done();
        });
      });
      it('topology should perform get topology operation successfully', function (done) {
        var cmd = 'network watcher topology -g {group} -n {name} --topology-resource-group {rgTopology} --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('ip-flow-verify should display ip flow details', function (done) {
        var cmd = 'network watcher ip-flow-verify -g {group} -n {name} --target {vmId} --direction {direction} --local-ip-address {localIpAddress} --local-port {localPort} --remote-ip-address {remoteIpAddress} --remote-port {remotePort} --protocol {protocol} --nic-id {nicId} --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('next-hop should display next hop details', function (done) {
        var cmd = 'network watcher next-hop -g {group} -n {name} --target {vmId} --source-ip-address {sourceIpAddress} --destination-ip-address {destinationIpAddress} --nic-id {nicId} --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('security-group-view should perform get vm security rules operation successfully', function (done) {
        var cmd = 'network watcher security-group-view -g {group} -n {name} --target {vmId} --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('troubleshoot should perform get troubleshooting operation successfully', function (done) {
        var cmd = 'network watcher troubleshoot -g {group} -n {name} --target {vpnId} --storage-id {storageId} --storage-path https://{storageName}.blob.core.windows.net/{blobName} --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('troubleshoot-result should perform get troubleshooting result operation successfully', function (done) {
        var cmd = 'network watcher troubleshoot-result -g {group} -n {name} --target {vpnId}  --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('configure-flow-log should perform set flow log configuration operation successfully', function (done) {
        var cmd = 'network watcher configure-flow-log -g {group} -n {name} --target {nsgId} --enable {enabled} --storage-id {storageId} --retention-enable {retentionPolicyEnabled} --retention-days {days}  --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('flow-log-status should perform get flow log status operation successfully', function (done) {
        var cmd = 'network watcher flow-log-status -g {group} -n {name} --target {nsgId}  --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('delete should delete network watchers', function (done) {
        var cmd = 'network watcher delete -g {group} -n {name} --quiet --json'.formatArgs(networkWatchers);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network watcher show -g {group} -n {name} --json'.formatArgs(networkWatchers);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);
            output.should.be.empty;
            done();
          });
        });
      });
    });
  });
});
