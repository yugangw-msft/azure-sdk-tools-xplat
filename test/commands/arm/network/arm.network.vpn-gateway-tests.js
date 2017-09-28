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

var CLITest = require('../../../framework/arm-cli-test');
var testUtils = require('../../../util/util');

var networkTestUtil = new (require('../../../util/networkTestUtil'))();

var testPrefix = 'arm-network-vpn-gateway-tests',
  groupName = 'xplat-test-vpn-gateway',
  location;

var gatewayProp = {
  name: 'test-vpn-gateway',
  vnetName: 'test-vnet',
  subnetName: 'GatewaySubnet',
  vnetAddressPrefix: '10.1.0.0/16',
  subnetAddressPrefix: '10.1.0.0/28',
  publicIpName: 'test-ip',
  gatewayType: 'Vpn',
  bgpPeeringAddress: '10.12.255.30',
  vpnType: 'RouteBased',
  sku: 'Standard',
  enableBgp: false,
  addressPrefix: '10.0.0.0/24',
  bgpSettingsAsn: 65010,
  newBgpSettingsAsn: 64999,
  bgpPeerWeight: 0,
  newBgpPeerWeight: 2,
  tags: networkTestUtil.tags,
  newTags: networkTestUtil.newTags
};

var rootCertProp = {
  name: 'test-root-cert',
  path: 'test/data/root-cert.pem'
};

var revokedCertProp = {
  name: 'test-revoked-cert',
  thumbprint: '633EBFFBD01B6049D51E3CF059CFD940C8CE5780'
};

var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'westeurope'
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
        location = process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);

        gatewayProp.group = groupName;
        gatewayProp.location = location;
        gatewayProp.name = suite.isMocked ? gatewayProp.name : suite.generateId(gatewayProp.name, null);
        gatewayProp.vnetName = suite.isMocked ? gatewayProp.vnetName : suite.generateId(gatewayProp.vnetName, null);
        gatewayProp.publicIpName = suite.isMocked ? gatewayProp.publicIpName : suite.generateId(gatewayProp.publicIpName, null);

        rootCertProp.group = groupName;
        rootCertProp.gatewayName = gatewayProp.name;

        revokedCertProp.group = groupName;
        revokedCertProp.gatewayName = gatewayProp.name;

        if (!suite.isPlayback()) {
          networkTestUtil.createGroup(groupName, location, suite, function () {
            done();
          });
        } else {
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

    describe('vpn-gateway', function () {
      this.timeout(testTimeout);

      it('create should create vpn gateway', function (done) {
        networkTestUtil.createVpnGateway(gatewayProp, suite, function () {
          done();
        });
      });

      it('set should modify vpn gateway', function (done) {
        var cmd = util.format('network vpn-gateway set -g {group} -n {name} -c {addressPrefix} ' +
          '-a {newBgpSettingsAsn} -j {newBgpPeerWeight} -t {newTags} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vpnGateway = JSON.parse(result.text);

          vpnGateway.name.should.equal(gatewayProp.name);
          vpnGateway.ipConfigurations.length.should.equal(1);
          vpnGateway.bgpSettings.asn.should.equal(gatewayProp.newBgpSettingsAsn);
          vpnGateway.bgpSettings.bgpPeeringAddress.should.equal(gatewayProp.bgpPeeringAddress);
          vpnGateway.bgpSettings.peerWeight.should.equal(gatewayProp.newBgpPeerWeight);

          var vpnConfig = vpnGateway.vpnClientConfiguration;
          vpnConfig.vpnClientAddressPool.addressPrefixes[0].should.equal(gatewayProp.addressPrefix);

          networkTestUtil.shouldAppendTags(vpnGateway);
          networkTestUtil.shouldBeSucceeded(vpnGateway);
          done();
        });
      });

      it('root-cert create should attach root certificate to vpn gateway', function (done) {
        var cmd = ('network vpn-gateway root-cert create -g {group} -n {gatewayName} ' +
          '-c {name} -f {path} --json').formatArgs(rootCertProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vpnGateway = JSON.parse(result.text);

          var rootCertificates = vpnGateway.vpnClientConfiguration.vpnClientRootCertificates;
          rootCertificates.length.should.equal(1);
          rootCertificates[0].name.should.equal(rootCertProp.name);

          done();
        });
      });

      it('root-cert delete should detach root certificate from vpn gateway', function (done) {
        var cmd = ('network vpn-gateway root-cert delete -g {group} -n {gatewayName} ' +
          '-c {name} --quiet --json').formatArgs(rootCertProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vpnGateway = JSON.parse(result.text);

          var rootCertificates = vpnGateway.vpnClientConfiguration.vpnClientRootCertificates;
          rootCertificates.length.should.equal(0);

          done();
        });
      });

      it('revoked-cert create should attach revoked certificate to vpn gateway', function (done) {
        var cmd = ('network vpn-gateway revoked-cert create -g {group} -n {gatewayName} ' +
          '-c {name} -f {thumbprint} --json').formatArgs(revokedCertProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vpnGateway = JSON.parse(result.text);

          var revokedCertificates = vpnGateway.vpnClientConfiguration.vpnClientRevokedCertificates;
          revokedCertificates.length.should.equal(1);
          revokedCertificates[0].name.should.equal(revokedCertProp.name);

          done();
        });
      });

      it('revoked-cert delete should detach revoked certificate from vpn gateway', function (done) {
        var cmd = ('network vpn-gateway revoked-cert delete -g {group} -n {gatewayName} ' +
          '-c {name} --quiet --json').formatArgs(revokedCertProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var vpnGateway = JSON.parse(result.text);

          var revokedCertificates = vpnGateway.vpnClientConfiguration.vpnClientRevokedCertificates;
          revokedCertificates.length.should.equal(0);

          done();
        });
      });

      it('delete should delete vpn gateway', function (done) {
        var cmd = 'network vpn-gateway delete -g {group} -n {name} --quiet --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network vpn-gateway show -g {group} -n {name} --json'.formatArgs(gatewayProp);
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