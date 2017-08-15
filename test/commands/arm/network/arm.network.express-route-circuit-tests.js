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
var utils = require('../../../../lib/util/utils');
var tagUtils = require('../../../../lib/commands/arm/tag/tagUtils');
var testUtils = require('../../../util/util');

var networkTestUtil = new (require('../../../util/networkTestUtil'))();

var generatorUtils = require('../../../../lib/util/generatorUtils');
var profile = require('../../../../lib/util/profile');
var $ = utils.getLocaleString;

var testPrefix = 'arm-network-express-route-circuit-tests',
  groupName = 'xplat-test-circuit-custom',
  location;

var circuitProps = {
  name: 'xplatExpressRouteCircuit',
  serviceProviderName: 'Interxion',
  peeringLocation: 'London',
  skuTier: "Standard",
  skuFamily: 'MeteredData',
  bandwidthInMbps: 50
};
var privatePeeringProps = {
  name: 'AzurePrivatePeering',
  type: 'AzurePrivatePeering',
  primaryAddress: "192.168.1.0/30",
  secondaryAddress: "192.168.2.0/30",
  peerAsn: 100,
  newPeerAsn: 101,
  vlanId: 200,
  newVlanId: 199
};
var publicPeeringProps = {
  name: 'AzurePublicPeering',
  type: 'AzurePublicPeering',
  primaryAddress: "192.168.1.0/30",
  secondaryAddress: "192.168.2.0/30",
  peerAsn: 110,
  newPeerAsn: 111,
  vlanId: 210,
  newVlanId: 209
};
var microsoftPeeringProps = {
  name: 'MicrosoftPeering',
  type: 'MicrosoftPeering',
  primaryAddress: "123.0.0.0/30",
  secondaryAddress: "123.0.0.4/30",
  peerAsn: 120,
  newPeerAsn: 121,
  vlanId: 220,
  newVlanId: 219,
  msAdvertisedPublicPrefixes: "123.1.0.0/24",
  newMsAdvertisedPublicPrefixes: "123.2.0.0/24",
  msCustomerAsn: 23,
  newMsCustomerAsn: 32,
  msRoutingRegistryName: "ARIN",
  newMsRoutingRegistryName: "LACNIC"
};
var premiumTier = 'Premium';

var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'brazilsouth'
}];

describe('arm', function () {
  describe('network', function () {
    var suite, retry = 5;
    var hour = 60 * 60000;

    before(function (done) {
      this.timeout(hour);
      suite = new CLITest(this, testPrefix, requiredEnvironment);
      suite.setupSuite(function () {
        location = process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.isMocked ? groupName : suite.generateId(groupName, null);

        circuitProps.location = location;
        circuitProps.group = groupName;
        circuitProps.name = suite.isMocked ? circuitProps.name : suite.generateId(circuitProps.name, null);

        privatePeeringProps.location = location;
        privatePeeringProps.group = groupName;
        privatePeeringProps.name = suite.isMocked ? privatePeeringProps.name : suite.generateId(privatePeeringProps.name, null);
        privatePeeringProps.expressRCName = circuitProps.name;
        
        publicPeeringProps.location = location;
        publicPeeringProps.group = groupName;
        publicPeeringProps.name = suite.isMocked ? publicPeeringProps.name : suite.generateId(publicPeeringProps.name, null);
        publicPeeringProps.expressRCName = circuitProps.name;

        microsoftPeeringProps.location = location;
        microsoftPeeringProps.group = groupName;
        microsoftPeeringProps.name = suite.isMocked ? microsoftPeeringProps.name : suite.generateId(microsoftPeeringProps.name, null);
        microsoftPeeringProps.expressRCName = circuitProps.name;

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
      this.timeout(hour);
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

    describe('express route circuits custom', function () {
      this.timeout(hour);

      it('create express route circuit should pass', function (done) {
        var cmd = ('network express-route circuit create -g {group} -n {name} -l {location} ' +
          '-p {serviceProviderName} -i {peeringLocation} -b {bandwidthInMbps} -e {skuTier} -f {skuFamily} --json').formatArgs(circuitProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var circuit = JSON.parse(result.text);

          circuit.name.should.equal(circuitProps.name);
          circuit.sku.tier.should.equal(circuitProps.skuTier);
          circuit.sku.family.should.equal(circuitProps.skuFamily);

          var provider = circuit.serviceProviderProperties;
          provider.serviceProviderName.should.equal(circuitProps.serviceProviderName);
          provider.peeringLocation.should.equal(circuitProps.peeringLocation);
          provider.bandwidthInMbps.should.equal(circuitProps.bandwidthInMbps);

          done();
        });
      });

      it('provider list should list available providers', function (done) {
        var cmd = 'network express-route provider list --json';
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var providers = JSON.parse(result.text);
          providers.should.be.an.Array;
          done();
        });
      });

      it('create private peering should pass', function (done) {
        var cmd = ('network express-route peering create {group} {expressRCName} {name} ' +
          '-y {type} -p {peerAsn} -r {primaryAddress} -o {secondaryAddress} -i {vlanId} --json').formatArgs(privatePeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);

          peering.name.should.equal(privatePeeringProps.name);
          peering.peeringType.should.equal(privatePeeringProps.type);
          peering.peerASN.should.equal(privatePeeringProps.peerAsn);
          peering.primaryPeerAddressPrefix.should.equal(privatePeeringProps.primaryAddress);
          peering.secondaryPeerAddressPrefix.should.equal(privatePeeringProps.secondaryAddress);
          peering.vlanId.should.equal(privatePeeringProps.vlanId);

          networkTestUtil.shouldBeSucceeded(peering);
          done();
        });
      });

      it('create public peering should pass', function (done) {
        var cmd = ('network express-route peering create {group} {expressRCName} {name} ' +
          '-y {type} -p {peerAsn} -r {primaryAddress} -o {secondaryAddress} -i {vlanId} --json').formatArgs(publicPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);

          peering.name.should.equal(publicPeeringProps.name);
          peering.peeringType.should.equal(publicPeeringProps.type);
          peering.peerASN.should.equal(publicPeeringProps.peerAsn);
          peering.primaryPeerAddressPrefix.should.equal(publicPeeringProps.primaryAddress);
          peering.secondaryPeerAddressPrefix.should.equal(publicPeeringProps.secondaryAddress);
          peering.vlanId.should.equal(publicPeeringProps.vlanId);

          networkTestUtil.shouldBeSucceeded(peering);
          done();
        });
      });

      it('create microsoft peering should not pass', false, function (done) {
        var cmd = ('network express-route peering create {group} {expressRCName} {name} ' +
          '-y {type} -p {peerAsn} -r {primaryAddress} -o {secondaryAddress} -i {vlanId} -l {msCustomerAsn} ' +
          '-f {msAdvertisedPublicPrefixes} -u {msRoutingRegistryName} --json').formatArgs(microsoftPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.not.equal(0);
          done();
        });
      });

      it('create microsoft peering should pass', false, function (done) {
        // Removes failed peering.
        var cmd = 'network express-route peering delete {group} {expressRCName} {name} -q --json'.formatArgs(microsoftPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function () {
          circuitProps.skuTier = premiumTier;
          networkTestUtil.setExpressRoute(circuitProps, suite, function () {
            cmd = ('network express-route peering create {group} {expressRCName} {name} ' +
              '-y {type} -p {peerAsn} -r {primaryAddress} -o {secondaryAddress} -i {vlanId} -l {msCustomerAsn} ' +
              '-f {msAdvertisedPublicPrefixes} -u {msRoutingRegistryName} --json').formatArgs(microsoftPeeringProps);
            testUtils.executeCommand(suite, retry, cmd, function (result) {
              result.exitStatus.should.equal(0);
              var peering = JSON.parse(result.text);

              peering.name.should.equal(microsoftPeeringProps.name);
              peering.peeringType.should.equal(microsoftPeeringProps.type);
              peering.peerASN.should.equal(microsoftPeeringProps.peerAsn);
              peering.primaryPeerAddressPrefix.should.equal(microsoftPeeringProps.primaryAddress);
              peering.secondaryPeerAddressPrefix.should.equal(microsoftPeeringProps.secondaryAddress);
              peering.vlanId.should.equal(microsoftPeeringProps.vlanId);
              peering.microsoftPeeringConfig.customerASN.should.equal(microsoftPeeringProps.msCustomerAsn);
              peering.microsoftPeeringConfig.routingRegistryName.should.equal(microsoftPeeringProps.msRoutingRegistryName);

              networkTestUtil.shouldBeSucceeded(peering);
              done();
            });
          });
        });
      });

      it('set should modify express-route private peering', function (done) {
        var cmd = ('network express-route peering set {group} {expressRCName} {name} ' +
          '-i {newVlanId} -p {newPeerAsn} --json').formatArgs(privatePeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);

          peering.name.should.equal(privatePeeringProps.name);
          peering.peeringType.should.equal(privatePeeringProps.type);
          peering.peerASN.should.equal(privatePeeringProps.newPeerAsn);
          peering.primaryPeerAddressPrefix.should.equal(privatePeeringProps.primaryAddress);
          peering.secondaryPeerAddressPrefix.should.equal(privatePeeringProps.secondaryAddress);
          peering.vlanId.should.equal(privatePeeringProps.newVlanId);

          done();
        });
      });

      it('set should modify express-route public peering', function (done) {
        var cmd = ('network express-route peering set {group} {expressRCName} {name} ' +
          '-i {newVlanId} -p {newPeerAsn} --json').formatArgs(publicPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);

          peering.name.should.equal(publicPeeringProps.name);
          peering.peeringType.should.equal(publicPeeringProps.type);
          peering.peerASN.should.equal(publicPeeringProps.newPeerAsn);
          peering.primaryPeerAddressPrefix.should.equal(publicPeeringProps.primaryAddress);
          peering.secondaryPeerAddressPrefix.should.equal(publicPeeringProps.secondaryAddress);
          peering.vlanId.should.equal(publicPeeringProps.newVlanId);

          done();
        });
      });

      it('set should modify express-route microsoft peering', false, function (done) {
        var cmd = ('network express-route peering set {group} {expressRCName} {name} ' +
          '-i {newVlanId} -p {newPeerAsn} -l {newMsCustomerAsn} -u {newMsRoutingRegistryName} --json').formatArgs(microsoftPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);

          peering.name.should.equal(microsoftPeeringProps.name);
          peering.peeringType.should.equal(microsoftPeeringProps.type);
          peering.peerASN.should.equal(microsoftPeeringProps.newPeerAsn);
          peering.primaryPeerAddressPrefix.should.equal(microsoftPeeringProps.primaryAddress);
          peering.secondaryPeerAddressPrefix.should.equal(microsoftPeeringProps.secondaryAddress);
          peering.vlanId.should.equal(microsoftPeeringProps.newVlanId);
          peering.microsoftPeeringConfig.customerASN.should.equal(microsoftPeeringProps.newMsCustomerAsn);
          peering.microsoftPeeringConfig.routingRegistryName.should.equal(microsoftPeeringProps.newMsRoutingRegistryName);

          done();
        });
      });

      it('show should display details of private express-route peering', function (done) {
        var cmd = 'network express-route peering show {group} {expressRCName} {name} --json'.formatArgs(privatePeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);
          peering.name.should.equal(privatePeeringProps.name);
          networkTestUtil.shouldBeSucceeded(peering);
          done();
        });
      });

      it('show should display details of public express-route peering', function (done) {
        var cmd = 'network express-route peering show {group} {expressRCName} {name} --json'.formatArgs(publicPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);
          peering.name.should.equal(publicPeeringProps.name);
          networkTestUtil.shouldBeSucceeded(peering);
          done();
        });
      });

      it('show should display details of microsoft express-route peering', false, function (done) {
        var cmd = 'network express-route peering show {group} {expressRCName} {name} --json'.formatArgs(microsoftPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var peering = JSON.parse(result.text);
          peering.name.should.equal(microsoftPeeringProps.name);
          networkTestUtil.shouldBeSucceeded(peering);
          done();
        });
      });

      it('list should display all express-routes peerings from resource group', function (done) {
        var cmd = 'network express-route peering list {group} {name} --json'.formatArgs(circuitProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var allPeerings = JSON.parse(result.text);

          _.some(allPeerings, function (peering) {
            return peering.name === privatePeeringProps.name;
          }).should.be.true;
          _.some(allPeerings, function (peering) {
            return peering.name === publicPeeringProps.name;
          }).should.be.true;
          _.some(allPeerings, function (peering) {
            return peering.name === microsoftPeeringProps.name;
          }).should.be.false;

          done();
        });
      });

      it('delete should delete private express-route peering', function (done) {
        var cmd = 'network express-route peering delete {group} {expressRCName} {name} -q --json'.formatArgs(privatePeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          
          cmd = 'network express-route peering show {group} {expressRCName} {name} --json'.formatArgs(privatePeeringProps);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            done();
          });
        });
      });

      it('delete should delete public express-route peering', function (done) {
        var cmd = 'network express-route peering delete {group} {expressRCName} {name} -q --json'.formatArgs(publicPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          
          cmd = 'network express-route peering show {group} {expressRCName} {name} --json'.formatArgs(publicPeeringProps);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            done();
          });
        });
      });

      it('delete should delete microsoft express-route peering', false, function (done) {
        var cmd = 'network express-route peering delete {group} {expressRCName} {name} -q --json'.formatArgs(microsoftPeeringProps);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          
          cmd = 'network express-route peering show {group} {expressRCName} {name} --json'.formatArgs(microsoftPeeringProps);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            done();
          });
        });
      });
    });
  });
});
