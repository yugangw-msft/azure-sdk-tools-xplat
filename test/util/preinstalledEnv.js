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

var testUtils = require('./util');
var CLITest = require('../framework/arm-cli-test');
var utils = require('../../lib/util/utils');
var NetworkTestUtil = require('./networkTestUtil');
var networkUtil = new NetworkTestUtil();
var VMTestUtil = require('./vmTestUtil');
var vmUtil = new VMTestUtil();

var retry = 5;

exports.getPacketCaptureEnv = function(groupName, location,
  vnetName, vnetPrefixes, subnetName, subnetPrefix, pipName, nicName, vmName, vmStorageAccount, vmScriptCfgPath,
  suite, callback) {
  var cmd = util.format('network vnet create -g %s -n %s -l %s --address-prefixes %s --json', groupName, vnetName, location, vnetPrefixes);
  testUtils.executeCommand(suite, retry, cmd, function (result) {
    result.exitStatus.should.equal(0);
    var cmd = util.format('network vnet subnet create -g %s --vnet-name %s -n %s --address-prefix %s --json',
      groupName, vnetName, subnetName, subnetPrefix);
    testUtils.executeCommand(suite, retry, cmd, function (result) {
      result.exitStatus.should.equal(0);
      var cmd = util.format('network public-ip create -g %s -n %s -l %s --json', groupName, pipName, location);
      testUtils.executeCommand(suite, retry, cmd, function (result) {
        var cmd = util.format('network nic create -g %s -n %s --subnet-vnet-name %s --subnet-name %s --public-ip-name %s -l %s --json',
          groupName, nicName, vnetName, subnetName, pipName, location);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          vmUtil.CreateVmWithNic(groupName, vmName, location, 'Windows', 'Win2012R2Datacenter', nicName, 'xplatuser', 'Pa$$word1', vmStorageAccount, suite, function(result) {
            var cmd = util.format('vm extension set %s %s -p Microsoft.Azure.NetworkWatcher -r NWAgent -n NetworkWatcherAgentWindows -o 1.4 --json', groupName, vmName);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              callback();
            });
          });
        });
      });
    });
  });
}

exports.getNetworkWatcherEnv = function(groupName, location,
  vnetName, vnetPrefixes, subnetName, subnetPrefix, pipName, nsgName, nicName, vmName, vmStorageAccount,
  vpnGateway, rgTopology, storageName, blobName, suite, callback) {
  var cmd = util.format('network vnet create -g %s -n %s -l %s --address-prefixes %s --json', groupName, vnetName, location, vnetPrefixes);
  testUtils.executeCommand(suite, retry, cmd, function (result) {
    result.exitStatus.should.equal(0);
    var cmd = util.format('network vnet subnet create -g %s --vnet-name %s -n %s --address-prefix %s --json',
      groupName, vnetName, subnetName, subnetPrefix);
    testUtils.executeCommand(suite, retry, cmd, function (result) {
      result.exitStatus.should.equal(0);
      var cmd = util.format('network public-ip create -g %s -n %s -l %s --json', groupName, pipName, location);
      testUtils.executeCommand(suite, retry, cmd, function (result) {
        result.exitStatus.should.equal(0);
        var cmd = util.format('network nsg create -g %s -n %s -l %s --json', groupName, nsgName, location);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var cmd = util.format('network nic create -g %s -n %s --subnet-vnet-name %s --subnet-name %s --public-ip-name %s -l %s --network-security-group-name %s --json',
            groupName, nicName, vnetName, subnetName, pipName, location, nsgName);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);
            vmUtil.CreateVmWithNic(groupName, vmName, location, 'Windows', 'Win2012R2Datacenter', nicName, 'xplatuser', 'Pa$$word1', vmStorageAccount, suite, function(result) {
              var cmd = util.format('group create %s westcentralus --json', rgTopology);
              testUtils.executeCommand(suite, retry, cmd, function (result) {
                networkUtil.createVpnGateway(vpnGateway, suite, function(result) {
                  var cmd = util.format('storage account create --resource-group %s %s --location %s --sku-name LRS --kind BlobStorage --access-tier Cool --json', groupName, storageName, location);
                  testUtils.executeCommand(suite, retry, cmd, function (result) {
                    result.exitStatus.should.equal(0);
                    var cmd = util.format('storage account connectionstring show -g %s %s --json', groupName, storageName);
                    testUtils.executeCommand(suite, retry, cmd, function (result) {
                      result.exitStatus.should.equal(0);
                      var output = JSON.parse(result.text);
                      var connectionString = output.string;
                      var cmd = util.format('storage container create --container %s -p Blob -c %s --json', blobName, connectionString);
                      testUtils.executeCommand(suite, retry, cmd, function (result) {
                        result.exitStatus.should.equal(0);
                        callback();
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
}
