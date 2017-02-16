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

var testPrefix = 'arm-network-watcher-packet-capture-tests',
  groupName = 'xplat-test-packet-capture',
  location;
var index = 0;

var packetCaptures = {
  location: 'westcentralus',
  networkWatcherName: 'networkWatchersName',
  name: 'packetCaptureName',
  vmName: 'TestVMForCap',
  vmStorageAccount: 'captureteststorageacc',
  nicName: 'testNicForCapture',
  vnetName: 'testVnetForCapture',
  vnetPrefixes: '10.0.0.0/8',
  subnetName: 'testSubnetForCapture',
  subnetPrefix: '10.0.0.0/16',
  pipName: 'publicIpForCapture',

  filePath: 'd:\\test.cap',
  bytesToCapturePerPacket: 100,
  totalBytesPerSession: 536870912,
  timeLimitInSeconds :15000,
  vmScriptCfgPath: 'test/data/custom-extension-capture.json',
  filtersProtocol: 'TCP',
  filtersIp: '10.0.0.11',
  filtersPort: '8080'
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
        location = packetCaptures.location || process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);
        packetCaptures.location = location;
        packetCaptures.group = groupName;
        packetCaptures.name = suite.isMocked ? packetCaptures.name : suite.generateId(packetCaptures.name, null);
        packetCaptures.filters = '[\{"protocol":"{filtersProtocol}","localIPAddress":"{filtersIp}","localPort":"{filtersPort}"\}]'.formatArgs(packetCaptures);
        if(!suite.isPlayback()) {
          networkUtil.createGroup(groupName, location, suite, function () {
            var cmd = 'network watcher create -g {1} -n {networkWatcherName} --location {location} --json'.formatArgs(packetCaptures, groupName);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              envUtil.getPacketCaptureEnv(groupName, location, packetCaptures.vnetName, packetCaptures.vnetPrefixes,
                packetCaptures.subnetName, packetCaptures.subnetPrefix,
                packetCaptures.pipName, packetCaptures.nicName,
                packetCaptures.vmName, packetCaptures.vmStorageAccount, packetCaptures.vmScriptCfgPath,
                suite, function() {
                var cmd = 'vm show -g {group} -n {vmName} --json'.formatArgs(packetCaptures);
                testUtils.executeCommand(suite, retry, cmd, function (result) {
                  result.exitStatus.should.equal(0);
                  var output = JSON.parse(result.text);
                  packetCaptures.vmId = output.id;
                  done();
                });
              });
            });
          });
        } else {
          var subscriptionId = profile.current.getSubscription().id;
          packetCaptures.vmId = suite.isMocked ? generatorUtils.generateResourceIdCommon(subscriptionId, groupName, 'virtualMachines', packetCaptures.vmName, 'compute') : suite.generateId(packetCaptures.vmId, null)
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

    describe('network watcher packet-capture', function () {
      this.timeout(hour);
      it('create should create packet captures', function (done) {
        var cmd = 'network watcher packet-capture create -g {group} -n {name} --target {vmId} --bytes-per-packet {bytesToCapturePerPacket} --bytes-per-session {totalBytesPerSession} --time-limit {timeLimitInSeconds} --local-file-path {filePath} --filters {filters} --watcher-name {networkWatcherName}  --json'.formatArgs(packetCaptures);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);
          output.name.should.equal(packetCaptures.name);
          output.target.toLowerCase().should.equal(packetCaptures.vmId.toLowerCase());
          output.bytesToCapturePerPacket.should.equal(parseInt(packetCaptures.bytesToCapturePerPacket, 10));
          output.totalBytesPerSession.should.equal(parseInt(packetCaptures.totalBytesPerSession, 10));
          output.timeLimitInSeconds.should.equal(parseInt(packetCaptures.timeLimitInSeconds, 10));
          output.storageLocation.filePath.toLowerCase().should.equal(packetCaptures.filePath.toLowerCase());
          done();
        });
      });
      it('show should display packet captures details', function (done) {
        var cmd = 'network watcher packet-capture show -g {group} -n {name} --watcher-name {networkWatcherName} --json'.formatArgs(packetCaptures);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.name.should.equal(packetCaptures.name);
          output.target.toLowerCase().should.equal(packetCaptures.vmId.toLowerCase());
          output.bytesToCapturePerPacket.should.equal(parseInt(packetCaptures.bytesToCapturePerPacket, 10));
          output.totalBytesPerSession.should.equal(parseInt(packetCaptures.totalBytesPerSession, 10));
          output.timeLimitInSeconds.should.equal(parseInt(packetCaptures.timeLimitInSeconds, 10));
          output.storageLocation.filePath.toLowerCase().should.equal(packetCaptures.filePath.toLowerCase());
          done();
        });
      });
      it('list should display all packet captures in resource group', function (done) {
        var cmd = 'network watcher packet-capture list -g {group} --watcher-name {networkWatcherName} --json'.formatArgs(packetCaptures);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var outputs = JSON.parse(result.text);
          _.some(outputs, function (output) {
            return output.name === packetCaptures.name;
          }).should.be.true;
          done();
        });
      });
      it('status should perform get status operation successfully', function (done) {
        var cmd = 'network watcher packet-capture status -g {group} -n {name} --watcher-name {networkWatcherName}  --json'.formatArgs(packetCaptures);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('stop should perform stop operation successfully', function (done) {
        var cmd = 'network watcher packet-capture stop -g {group} -n {name} --watcher-name {networkWatcherName}  --json'.formatArgs(packetCaptures);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('delete should delete packet captures', function (done) {
        var cmd = 'network watcher packet-capture delete -g {group} -n {name} --quiet --watcher-name {networkWatcherName} --json'.formatArgs(packetCaptures);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network watcher packet-capture show -g {group} -n {name} --watcher-name {networkWatcherName} --json'.formatArgs(packetCaptures);
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
