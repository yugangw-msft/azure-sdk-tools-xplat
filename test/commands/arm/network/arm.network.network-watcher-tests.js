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

var CLITest = require('../../../framework/arm-cli-test');
var utils = require('../../../../lib/util/utils');
var testUtils = require('../../../util/util');

var networkTestUtil = new (require('../../../util/networkTestUtil'))();

var generatorUtils = require('../../../../lib/util/generatorUtils');
var profile = require('../../../../lib/util/profile');
var $ = utils.getLocaleString;

var testPrefix = 'arm-network-network-watcher-tests',
  groupName = 'xplat-test-network-watcher-custom',
  location;

var networkWatcher = {
  location: 'westcentralus',
  name: 'networkWatcherName',
  virtualNetworkName: 'virtualNetworkName',
  virtualNetworkAddressPrefix: '10.0.0.0/8',
  subnetName: 'subnetName',
  subnetAddressPrefix: '10.0.1.0/24'
};

var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'westcentralus'
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
        location = networkWatcher.location || process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);
        
        networkWatcher.location = location;
        networkWatcher.group = groupName;
        networkWatcher.name = suite.isMocked ? networkWatcher.name : suite.generateId(networkWatcher.name, null);

        if (!suite.isPlayback()) {
          networkTestUtil.createGroup(groupName, location, suite, function () {
            var cmd = 'network vnet create -g {1} -n {virtualNetworkName} --location {location} -a {virtualNetworkAddressPrefix} --json'.formatArgs(networkWatcher, groupName);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              var output = JSON.parse(result.text);
              networkWatcher.virtualNetworkId = output.id;

              var cmd = 'network vnet subnet create -g {1} -n {subnetName} --address-prefix {subnetAddressPrefix} --vnet-name {virtualNetworkName} --json'.formatArgs(networkWatcher, groupName);
              testUtils.executeCommand(suite, retry, cmd, function (result) {
                result.exitStatus.should.equal(0);
                var output = JSON.parse(result.text);
                networkWatcher.subnetId = output.id;
                var cmd = 'network watcher create -g {1} -n {name} --location {location} --json'.formatArgs(networkWatcher, groupName);
                testUtils.executeCommand(suite, retry, cmd, function (result) {
                  done();
                });
              });
            });
          });
        } else {
          var subscriptionId = profile.current.getSubscription().id;
          networkWatcher.virtualNetworkId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'virtualNetworks', networkWatcher.virtualNetworkName);
          networkWatcher.subnetId = generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'virtualNetworks/' + networkWatcher.virtualNetworkName + '/subnets', networkWatcher.subnetName);
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

    describe('network watchers custom', function () {
      this.timeout(testTimeout);

      it('topology should get topology by virtual network id', function (done) {
        var cmd = ('network watcher topology -g {group} -n {name} --target-vnet-id {virtualNetworkId} --json').formatArgs(networkWatcher);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('topology should get topology by subnet id', function (done) {
        var cmd = ('network watcher topology -g {group} -n {name} --target-subnet-id {subnetId} --json').formatArgs(networkWatcher);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
    });
  });
});
