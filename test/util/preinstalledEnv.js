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

var testUtils = require('./util');
var utils = require('../../lib/util/utils');
var retry = 5;

var networkTestUtil = new (require('./networkTestUtil'))();
var vmTestUtil = new (require('./vmTestUtil'))();

var generatorUtils = require('../../lib/util/generatorUtils');

function PreinstalledEnv () {}

_.extend(PreinstalledEnv.prototype, {
  getNetworkWatcherEnv: function (dependencyObject, paramObject, groupName, suite, callbackOrSubId) {
    dependencyObject.storagePath = "https://{storageName}.blob.core.windows.net/{blobName}".formatArgs(paramObject);
    
    if (suite.isPlayback()) {
      dependencyObject.virtualMachineId = generatorUtils.generateResourceIdCommon(callbackOrSubId, groupName, 'virtualMachines', paramObject.vmName);
      dependencyObject.vpnGatewayId = generatorUtils.generateResourceIdCommon(callbackOrSubId, groupName, 'virtualNetworkGateways', paramObject.vpnGatewayName);
      dependencyObject.storageId = generatorUtils.generateResourceIdCommon(callbackOrSubId, groupName, 'storageAccounts', paramObject.storageName, 'Storage');
      return;
    }

    vmTestUtil.CreateVmWithNic(groupName, paramObject.vmName, dependencyObject.location, paramObject.osType, paramObject.imageUrn, dependencyObject.networkInterfaceName, 'xplatuser', 'Pa$$word1', paramObject.vmStorageAccount, suite, function () {
      var cmd = util.format('vm show %s %s --json', groupName, paramObject.vmName);
      testUtils.executeCommand(suite, retry, cmd, function (result) {
        result.exitStatus.should.equal(0);
        var output = JSON.parse(result.text);

        dependencyObject.virtualMachineId = output.id;

        var cmd = util.format('vm extension set %s %s -p Microsoft.Azure.NetworkWatcher -r NWAgent -n NetworkWatcherAgentWindows -o 1.4 --json', groupName, paramObject.vmName);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          var vpnGateway = _.clone(paramObject);
          vpnGateway.name = paramObject.vpnGatewayName;
          vpnGateway.tags = networkTestUtil.tags;
          vpnGateway.group = groupName;
          vpnGateway.location = dependencyObject.location;

          networkTestUtil.createVpnGateway(vpnGateway, suite, function (result) {
            dependencyObject.vpnGatewayId = result.id;

            var cmd = util.format('storage account create --resource-group %s %s --location %s --sku-name LRS --kind BlobStorage --access-tier Cool --json', groupName, paramObject.storageName, dependencyObject.location);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);

              var cmd = util.format('storage account show -g %s %s --json', groupName, paramObject.storageName);
              testUtils.executeCommand(suite, retry, cmd, function (result) {
                result.exitStatus.should.equal(0);
                var output = JSON.parse(result.text);

                dependencyObject.storageId = output.id;

                var cmd = util.format('storage account connectionstring show -g %s %s --json', groupName, paramObject.storageName);
                testUtils.executeCommand(suite, retry, cmd, function (result) {
                  result.exitStatus.should.equal(0);
                  var output = JSON.parse(result.text);

                  var cmd = util.format('storage container create --container %s -p Blob -c %s --json', paramObject.blobName, output.string);
                  testUtils.executeCommand(suite, retry, cmd, function (result) {
                    result.exitStatus.should.equal(0);
                    callbackOrSubId(result);
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  getPacketCaptureEnv: function (dependencyObject, paramObject, groupName, suite, callbackOrSubId) {
    if (suite.isPlayback()) {
      dependencyObject.target = generatorUtils.generateResourceIdCommon(callbackOrSubId, groupName, 'virtualMachines', paramObject.vmName, 'Compute');
      return;
    }

    vmTestUtil.CreateVmWithNic(groupName, paramObject.vmName, dependencyObject.location, paramObject.osType, paramObject.imageUrn, dependencyObject.networkInterfaceName, 'xplatuser', 'Pa$$word1', paramObject.vmStorageAccount, suite, function () {
      var cmd = util.format('vm show %s %s --json', groupName, paramObject.vmName);
      testUtils.executeCommand(suite, retry, cmd, function (result) {
        result.exitStatus.should.equal(0);
        var output = JSON.parse(result.text);

        dependencyObject.target = output.id;

        var cmd = util.format('vm extension set %s %s -p Microsoft.Azure.NetworkWatcher -r NWAgent -n NetworkWatcherAgentWindows -o 1.4 --json', groupName, paramObject.vmName);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          callbackOrSubId(result);
        });
      });
    });
  }
});

module.exports = PreinstalledEnv;