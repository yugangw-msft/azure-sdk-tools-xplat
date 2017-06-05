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
var NetworkTestUtil = require('../../../util/networkTestUtil');
var networkUtil = new NetworkTestUtil();

var testPrefix = 'arm-network-vnet-tests',
  groupName = 'xplat-test-vnet',
  location;

var vnetProp = {
  name: 'test-vnet',
  dnsServer: '192.168.1.1',
  newDnsServer: '192.168.1.2',
  addressPrefix: '10.0.0.0/24',
  newAddressPrefix: '10.0.1.0/24',
  tags: networkUtil.tags,
  newTags: networkUtil.newTags
};

var virtualNetworksDefault = {
  location: 'westus',
  addressPrefixes: '10.0.0.0/8',
  name: 'virtualNetworksDefaultName',
  group: groupName
};

var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'eastus'
}];

describe('arm', function () {
  describe('network', function () {
    var suite, retry = 5;

    before(function (done) {
      suite = new CLITest(this, testPrefix, requiredEnvironment);
      suite.setupSuite(function () {
        location = process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);

        vnetProp.location = location;
        vnetProp.group = groupName;
        vnetProp.name = suite.isMocked ? vnetProp.name : suite.generateId(vnetProp.name, null);

        done();
      });
    });
    after(function (done) {
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

    describe('vnet', function () {
      it('create should create vnet', function (done) {
        networkUtil.createGroup(groupName, location, suite, function () {
          var cmd = 'network vnet create -g {group} -n {name} -l {location} -a {addressPrefix} -d {dnsServer} -t {tags} --json'
            .formatArgs(vnetProp);

          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var vnet = JSON.parse(result.text);
            vnet.name.should.equal(vnetProp.name);
            vnet.addressSpace.addressPrefixes.length.should.equal(1);
            vnet.addressSpace.addressPrefixes.should.containEql(vnetProp.addressPrefix);
            vnet.dhcpOptions.dnsServers.length.should.equal(1);
            vnet.dhcpOptions.dnsServers.should.containEql(vnetProp.dnsServer);
            networkUtil.shouldHaveTags(vnet);
            networkUtil.shouldBeSucceeded(vnet);
            done();
          });
        });
      });
      it('show should display details of vnet', function (done) {
        var cmd = 'network vnet show -g {group} -n {name} --json'.formatArgs(vnetProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vnet = JSON.parse(result.text);
          vnet.name.should.equal(vnetProp.name);
          vnet.addressSpace.addressPrefixes.length.should.equal(1);
          vnet.addressSpace.addressPrefixes.should.containEql(vnetProp.addressPrefix);
          vnet.dhcpOptions.dnsServers.length.should.equal(1);
          vnet.dhcpOptions.dnsServers.should.containEql(vnetProp.dnsServer);
          networkUtil.shouldHaveTags(vnet);
          networkUtil.shouldBeSucceeded(vnet);
          done();
        });
      });
      it('set should modify vnet', function (done) {
        var cmd = 'network vnet set -g {group} -n {name} -a {newAddressPrefix} -d {newDnsServer} -t {newTags} --json'
          .formatArgs(vnetProp);

        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vnet = JSON.parse(result.text);
          vnet.name.should.equal(vnetProp.name);
          vnet.addressSpace.addressPrefixes.length.should.equal(2);
          vnet.addressSpace.addressPrefixes.should.containEql(vnetProp.addressPrefix);
          vnet.addressSpace.addressPrefixes.should.containEql(vnetProp.newAddressPrefix);
          vnet.dhcpOptions.dnsServers.length.should.equal(2);
          vnet.dhcpOptions.dnsServers.should.containEql(vnetProp.dnsServer);
          vnet.dhcpOptions.dnsServers.should.containEql(vnetProp.newDnsServer);
          networkUtil.shouldAppendTags(vnet);
          networkUtil.shouldBeSucceeded(vnet);
          done();
        });
      });
      it('list should display all vnets from resource group', function (done) {
        var cmd = 'network vnet list -g {group} --json'.formatArgs(vnetProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vnets = JSON.parse(result.text);
          _.some(vnets, function (vnet) {
            return vnet.name === vnetProp.name;
          }).should.be.true;
          done();
        });
      });
      it('usage should perform list usage operation successfully', function (done) {
        var cmd = 'network vnet usage -g {group} -n {name}  --json'.formatArgs(vnetProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });
      it('delete should delete vnet', function (done) {
        var cmd = 'network vnet delete -g {group} -n {name} --quiet --json'.formatArgs(vnetProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network vnet show -g {group} -n {name} --json'.formatArgs(vnetProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var vnet = JSON.parse(result.text);
            vnet.should.be.empty;
            done();
          });
        });
      });
      it('create with defaults should create virtual networks with default values', function (done) {
        var cmd = 'network vnet create -g {group} -n {name} --location {location}  --json'.formatArgs(virtualNetworksDefault);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);
          output.name.should.equal(virtualNetworksDefault.name);
          virtualNetworksDefault.addressPrefixes.split(',').forEach(function(item) { output.addressSpace.addressPrefixes.should.containEql(item) });
          var cmd = 'network vnet delete -g {group} -n {name} --quiet --json'.formatArgs(virtualNetworksDefault);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            done();
          });
        });
      });
      it('set should pass for changing dns servers from empty value to valid', function (done) {
        var cmd = ('network vnet create -g {group} -n {name} --address-prefixes {addressPrefix} --location {location}  --json').formatArgs(vnetProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);
          output.name.should.equal(vnetProp.name);
          vnetProp.addressPrefix.split(',').forEach(function(item) { output.addressSpace.addressPrefixes.should.containEql(item) });

          var cmd = ('network vnet set -g {group} -n {name} --dns-servers {dnsServer}  --json').formatArgs(vnetProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);
            output.name.should.equal(vnetProp.name);
            vnetProp.dnsServer.split(',').forEach(function(item) { output.dhcpOptions.dnsServers.should.containEql(item) });

            var cmd = ('network vnet delete -g {group} -n {name} --json --quiet').formatArgs(vnetProp);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              done();
            });
          });
        });
      });
    });
  });
});