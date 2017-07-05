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

var testPrefix = 'arm-network-application-gateway-custom-tests',
  groupName = 'xplat-test-application-gateway-custom',
  location;

var gatewayProp = {
  // Env
  subnetAddress: '10.0.0.0/11',
  subnetName: 'xplatTestSubnet',
  vnetAddress: '10.0.0.0/8',
  vnetName: 'xplatTestVnet',
  publicIpName: 'xplatTestPublicIP',

  // Defaults
  defaultSslCertPath: 'test/data/sslCert.pfx',
  defFrontendIpName: 'frontendIp01',
  defHttpListenerName: 'listener01',
  defHttpSettingName: 'httpSettings01',
  defPoolName: 'pool01',
  defSslCertName: 'cert01',

  // AppGW
  name: 'xplatTestAppGw',
  capacity: 2,
  configName: 'ipConfig01',
  createConfigName: 'config02',
  frontendIpName: 'testFrontendIp',
  httpSettingsPortAddress: 111,
  httpSettingsProtocol: 'http',
  portName: 'xplatTestPoolName',
  portValue: 112,
  ruleName: 'xplatTestRule',
  ruleType: 'Basic',
  servers: '1.1.1.1',
  skuName: 'Standard_Small',
  skuTier: 'Standard',
  sslPassword: 'pswd',
  tags: networkTestUtil.tags,

  // Address Pool
  poolName: 'xplatTestPoolName',
  poolServers: '4.4.4.4,3.3.3.3',
  poolServersNew: '1.2.3.4,3.4.3.3',

  // Frontend Port
  frontendPortName: 'xplatTestFrontendPort',
  frontendPort: '4242',

  // HTTP Listener
  httpListenerName: 'xplatTestListener',
  httpListenerProtocol: 'Https',

  // HTTP Settings
  cookieBasedAffinity: 'Disabled',
  cookieBasedAffinityNew: 'Enabled',
  httpProtocol: 'Http',
  httpSettingsName1: 'httpSettingsName1',
  httpSettingsName: 'xplatTestHttpSettings',
  httpSettingsPort: 234,
  httpSettingsPortNew: 345,

  // Redirect Config
  targetListenerId: null,
  redirectConfigName01: 'firstCfg',
  redirectConfigName02: 'secondCfg',
  redirectType01: 'Permanent',
  redirectType02: 'Temporary',
  redirectTargetUrl: 'http://bing.com',
  redirectIncludePath: true,

  // URL Path Map & UPM Rules
  httpSettingsPort1: 456,
  mapPath: '/test',
  newMapPath1: '/test02',
  newMapPath: '/test01',
  newUrlMapRuleName: 'rule01',
  urlMapRuleName: 'urlMapRuleName01',
  urlPathMapName: 'urlPathMapName01',

  // WAF Config,
  wafSkuName: 'WAF_Medium',
  wafSkuTier: 'WAF',
  firewallEnabled: true,
  firewallMode: "Prevention",
  ruleSetType: 'OWASP',
  ruleSetVersion: '3.0',
  disabledRuleGroupName: 'REQUEST-910-IP-REPUTATION',
  disabledRuleGroupRules: '910000,910011,910012'
};

var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'eastus'
}];

describe('arm', function () {
  describe('network', function () {
    var suite, retry = 5;
    var hour = 60 * 60000;
    var testTimeout = 2 * hour;

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
        gatewayProp.subnetName = suite.isMocked ? gatewayProp.subnetName : suite.generateId(gatewayProp.subnetName, null);
        gatewayProp.configName = suite.isMocked ? gatewayProp.configName : suite.generateId(gatewayProp.configName, null);
        gatewayProp.frontendIpName = suite.isMocked ? gatewayProp.frontendIpName : suite.generateId(gatewayProp.frontendIpName, null);
        gatewayProp.poolName = suite.isMocked ? gatewayProp.poolName : suite.generateId(gatewayProp.poolName, null);
        gatewayProp.portName = suite.isMocked ? gatewayProp.portName : suite.generateId(gatewayProp.portName, null);
        gatewayProp.httpListenerName = suite.isMocked ? gatewayProp.httpListenerName : suite.generateId(gatewayProp.httpListenerName, null);
        gatewayProp.httpSettingsName = suite.isMocked ? gatewayProp.httpSettingsName : suite.generateId(gatewayProp.httpSettingsName, null);
        gatewayProp.ruleName = suite.isMocked ? gatewayProp.ruleName : suite.generateId(gatewayProp.ruleName, null);
        gatewayProp.urlPathMapName = suite.isMocked ? gatewayProp.urlPathMapName : suite.generateId(gatewayProp.urlPathMapName, null);
        gatewayProp.urlMapRuleName = suite.isMocked ? gatewayProp.urlMapRuleName : suite.generateId(gatewayProp.urlMapRuleName, null);
        gatewayProp.sslCertName = suite.isMocked ? gatewayProp.sslCertName : suite.generateId(gatewayProp.sslCertName, null);

        if (!suite.isPlayback()) {
          networkTestUtil.createGroup(gatewayProp.group, gatewayProp.location, suite, function () {
            networkTestUtil.createVnet(gatewayProp.group, gatewayProp.vnetName, gatewayProp.location, gatewayProp.vnetAddress, suite, function () {
              networkTestUtil.createSubnet(gatewayProp.group, gatewayProp.vnetName, gatewayProp.subnetName, gatewayProp.subnetAddress, suite, function () {
                networkTestUtil.createPublicIpLegacy(gatewayProp.group, gatewayProp.publicIpName, gatewayProp.location, suite, function () {
                  done();
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

    describe('application-gateway custom', function () {
      this.timeout(testTimeout);

      it('create should pass', function (done) {
        var cmd = ('network application-gateway create {group} {name} -l {location} -e {vnetName} -m {subnetName} ' +
          '-i {httpSettingsProtocol} -o {httpSettingsPortAddress} -b {httpListenerProtocol} -k {publicIpName} ' +
          '-r {servers} -y {defaultSslCertPath} -x {sslPassword} -f {cookieBasedAffinity} ' +
          '-j {portValue} -w {ruleType} -a {skuName} -u {skuTier} -z {capacity} -t {tags} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);
          appGateway.location.should.equal(gatewayProp.location);
          appGateway.sku.name.should.equal(gatewayProp.skuName);
          appGateway.sku.tier.should.equal(gatewayProp.skuTier);
          appGateway.sku.capacity.should.equal(gatewayProp.capacity);

          _.some(appGateway.gatewayIPConfigurations, function (ipConfig) {
            return ipConfig.name === gatewayProp.configName;
          }).should.be.true;

          _.some(appGateway.sslCertificates, function(sslCert) {
            return sslCert.name === gatewayProp.defSslCertName;
          }).should.be.true;

          _.some(appGateway.frontendIPConfigurations, function(frontendIP) {
            return frontendIP.name === gatewayProp.defFrontendIpName;
          }).should.be.true;

          _.some(appGateway.frontendPorts, function(frontendPort) {
            return frontendPort.port === gatewayProp.portValue;
          }).should.be.true;

          _.some(appGateway.backendAddressPools, function(addressPool) {
            return addressPool.name === gatewayProp.defPoolName;
          }).should.be.true;

          _.some(appGateway.backendHttpSettingsCollection, function(settings) {
            return settings.port === gatewayProp.httpSettingsPortAddress
                && settings.protocol.toLowerCase() === gatewayProp.httpSettingsProtocol.toLowerCase()
                && settings.cookieBasedAffinity === gatewayProp.cookieBasedAffinity;
          }).should.be.true;

          _.some(appGateway.httpListeners, function(listener) {
            return listener.protocol.toLowerCase() === gatewayProp.httpListenerProtocol.toLowerCase();
          }).should.be.true;

          networkTestUtil.shouldHaveTags(appGateway);
          networkTestUtil.shouldBeSucceeded(appGateway);
          done();
        });
      });

      it('list should display all application gateways from all resource groups', function (done) {
        var cmd = 'network application-gateway list --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var gateways = JSON.parse(result.text);

          _.some(gateways, function (appGw) {
            return appGw.name === gatewayProp.name;
          }).should.be.true;
          
          done();
        });
      });

      it('list should display application gateways from specified resource group', function (done) {
        var cmd = 'network application-gateway list {group} --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var gateways = JSON.parse(result.text);

          _.some(gateways, function (appGw) {
            return appGw.name === gatewayProp.name;
          }).should.be.true;
          
          done();
        });
      });

      it('start should not fail already started application gateway', function (done) {
        var cmd = 'network application-gateway start {group} {name} --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('address-pool create command should create new address pool in application gateway', function (done) {
        var cmd = 'network application-gateway address-pool create {group} {name} {poolName} -r {poolServers} --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var addressPool = utils.findFirstCaseIgnore(appGateway.backendAddressPools, { name: gatewayProp.poolName });
          addressPool.name.should.equal(gatewayProp.poolName);

          var pools = gatewayProp.poolServers.split(',');
          var index = 0;
          addressPool.backendAddresses.forEach(function (address) {
            address.ipAddress.should.equal(pools[index]);
            index++;
          });

          networkTestUtil.shouldBeSucceeded(addressPool);
          done();
        });
      });

      it('address-pool set should update backend address pool in application gateway', function (done) {
        var cmd = 'network application-gateway address-pool set {group} {name} {poolName} --servers {poolServersNew} --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var addressPool = utils.findFirstCaseIgnore(appGateway.backendAddressPools, { name: gatewayProp.poolName });
          addressPool.name.should.equal(gatewayProp.poolName);

          gatewayProp.poolServersNew.split(',').map(function(item) {
            return { ipAddress: item };
          }).forEach(function(item) {
            addressPool.backendAddresses.should.containEql(item);
          });

          done();
        });
      });

      it('http-settings create command should create new http settings in application gateway', function (done) {
        var cmd = ('network application-gateway http-settings create {group} {name} {httpSettingsName} ' +
          '-o {httpSettingsPort} -c {cookieBasedAffinity} -p {httpProtocol} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var setting = utils.findFirstCaseIgnore(appGateway.backendHttpSettingsCollection, { name: gatewayProp.httpSettingsName });
          setting.name.should.equal(gatewayProp.httpSettingsName);
          setting.port.should.equal(gatewayProp.httpSettingsPort);
          setting.cookieBasedAffinity.should.equal(gatewayProp.cookieBasedAffinity);
          setting.protocol.should.equal(gatewayProp.httpProtocol);

          networkTestUtil.shouldBeSucceeded(setting);
          done();
        });
      });

      it('http-settings set should update http settings application gateway', function (done) {
        var cmd = ('network application-gateway http-settings set {group} {name} {httpSettingsName} ' +
          '--port {httpSettingsPortNew} --cookie-based-affinity {cookieBasedAffinityNew} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var httpSettings = utils.findFirstCaseIgnore(appGateway.backendHttpSettingsCollection, { name: gatewayProp.httpSettingsName });
          httpSettings.name.should.equal(gatewayProp.httpSettingsName);
          httpSettings.port.should.equal(gatewayProp.httpSettingsPortNew);
          httpSettings.cookieBasedAffinity.toLowerCase().should.equal(gatewayProp.cookieBasedAffinityNew.toLowerCase());

          done();
        });
      });

      it('frontend-ip create command should create new frontend ip in application gateway', function (done) {
        var cmd = ('network application-gateway frontend-ip create {group} {name} {frontendIpName} ' +
          '--vnet-name {vnetName} --subnet-name {subnetName} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          var frontendIp = utils.findFirstCaseIgnore(appGateway.frontendIPConfigurations, { name: gatewayProp.frontendIpName });
          frontendIp.name.should.equal(gatewayProp.frontendIpName);

          networkTestUtil.shouldBeSucceeded(frontendIp);
          done();
        });
      });

      it('frontend-port create command should create new frontend port in application gateway', function (done) {
        var cmd = ('network application-gateway frontend-port create {group} {name} {frontendPortName} ' +
          '--port {frontendPort} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          var frontendPort = utils.findFirstCaseIgnore(appGateway.frontendPorts, { name: gatewayProp.frontendPortName });
          frontendPort.name.should.equal(gatewayProp.frontendPortName);

          networkTestUtil.shouldBeSucceeded(frontendPort);
          done();
        });
      });

      it('http-listener create command should create new http listener in application gateway', function (done) {
        var cmd = ('network application-gateway http-listener create {group} {name} {httpListenerName} ' +
          '--frontend-ip-name {frontendIpName} --frontend-port-name {frontendPortName} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          var httpListener = utils.findFirstCaseIgnore(appGateway.httpListeners, { name: gatewayProp.httpListenerName });
          httpListener.name.should.equal(gatewayProp.httpListenerName);

          gatewayProp.targetListenerId = httpListener.id;

          networkTestUtil.shouldBeSucceeded(httpListener);
          done();
        });
      });

      it('redirect-config create command should create new redirect config in application gateway', function (done) {
        var cmd = ('network application-gateway redirect-config create {group} {name} {redirectConfigName01} ' +
          '--redirect-type {redirectType01} --include-path {redirectIncludePath} ' +
          '--target-listener-id {targetListenerId} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          var redirectConfig = utils.findFirstCaseIgnore(appGateway.redirectConfigurations, { name: gatewayProp.redirectConfigName01 });
          redirectConfig.name.should.equal(gatewayProp.redirectConfigName01);

          done();
        });
      });

      it('url path map create should create map in application gateway', function (done) {
        var cmd = ('network application-gateway url-path-map create {group} {name} {urlPathMapName} ' +
          '--http-settings-name {defHttpSettingName} --address-pool-name {defPoolName} ' +
          '--default-redirect-configuration-name {redirectConfigName01} --rule-name {urlMapRuleName} --path {mapPath} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, { name: gatewayProp.urlPathMapName });
          urlPathMap.name.should.equal(gatewayProp.urlPathMapName);

          _.some(urlPathMap.pathRules, function (rule) {
            return rule.name === gatewayProp.urlMapRuleName;
          }).should.be.true;

          networkTestUtil.shouldBeSucceeded(urlPathMap);
          done();
        });
      });

      it('redirect-config create command should create second redirect config in application gateway', function (done) {
        var cmd = ('network application-gateway redirect-config create {group} {name} {redirectConfigName02} ' +
          '--redirect-type {redirectType02} --target-url {redirectTargetUrl} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          var redirectConfig = utils.findFirstCaseIgnore(appGateway.redirectConfigurations, { name: gatewayProp.redirectConfigName02 });
          redirectConfig.name.should.equal(gatewayProp.redirectConfigName02);

          done();
        });
      });

      it('url path map rule create 2nd should create map rule in application gateway', function (done) {
        var cmd = ('network application-gateway url-path-map rule create {group} {name} {newUrlMapRuleName} ' +
          '-u {urlPathMapName} -p {newMapPath} -b {redirectConfigName02} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: gatewayProp.urlPathMapName});
          urlPathMap.name.should.equal(gatewayProp.urlPathMapName);

          _.some(urlPathMap.pathRules, function (rule) {
            return rule.name === gatewayProp.newUrlMapRuleName;
          }).should.be.true;

          networkTestUtil.shouldBeSucceeded(urlPathMap);
          done();
        });
      });

      it('url path map rule show should display created rule of URL path map', function (done) {
        var cmd = ('network application-gateway url-path-map rule show {group} {name} ' +
          '{urlPathMapName} {newUrlMapRuleName} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var urlPathMapRule = JSON.parse(result.text);

          urlPathMapRule.name.should.equal(gatewayProp.newUrlMapRuleName);

          done();
        });
      });

      it('url path map rule list should display all rules from URL path map', function (done) {
        var cmd = 'network application-gateway url-path-map rule list {group} {name} {urlPathMapName} {urlMapRuleName} --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var urlPathMapRules = JSON.parse(result.text);

          _.some(urlPathMapRules, function(urlPathMapRule) {
            return urlPathMapRule.name === gatewayProp.newUrlMapRuleName
          }).should.be.true;

          done();
        });
      });

      it('url path map rule set should modify map in application gateway', function (done) {
        var cmd = ('network application-gateway http-settings create {group} {name} {httpSettingsName1} ' +
          '-o {httpSettingsPort1} -c {cookieBasedAffinity} -p {httpProtocol} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = ('network application-gateway url-path-map rule set {group} {name} {newUrlMapRuleName} ' +
            '-u {urlPathMapName} -p {newMapPath1} -i {httpSettingsName1} --json').formatArgs(gatewayProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var appGateway = JSON.parse(result.text);

            appGateway.name.should.equal(gatewayProp.name);

            var urlPathMap = utils.findFirstCaseIgnore( appGateway.urlPathMaps, {name: gatewayProp.urlPathMapName});
            urlPathMap.name.should.equal(gatewayProp.urlPathMapName);

            _.some(urlPathMap.pathRules, function (rule) {
              return rule.name === gatewayProp.newUrlMapRuleName
                  && rule.backendHttpSettings
                  && rule.backendAddressPool;
            }).should.be.true;

            networkTestUtil.shouldBeSucceeded(urlPathMap);
            done();
          });
        });
      });

      it('url path map set should modify map in application gateway', function (done) {
        var cmd = ('network application-gateway url-path-map set {group} {name} {urlPathMapName} ' +
          '-i {httpSettingsName1} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var urlPathMap = utils.findFirstCaseIgnore( appGateway.urlPathMaps, {name: gatewayProp.urlPathMapName});
          urlPathMap.name.should.equal(gatewayProp.urlPathMapName);
          urlPathMap.defaultBackendHttpSettings.should.not.be.empty;
          urlPathMap.defaultBackendAddressPool.should.not.be.empty;

          networkTestUtil.shouldBeSucceeded(urlPathMap);
          done();
        });
      });

      it('url path map rule delete should remove map rule in application gateway', function (done) {
        var cmd = ('network application-gateway url-path-map rule delete {group} {name} ' +
          '{newUrlMapRuleName} -u {urlPathMapName} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: gatewayProp.urlPathMapName});
          urlPathMap.name.should.equal(gatewayProp.urlPathMapName);

          _.some(urlPathMap.pathRules, function (rule) {
            return rule.name === gatewayProp.newUrlMapRuleName;
          }).should.be.false;

          networkTestUtil.shouldBeSucceeded(urlPathMap);
          done();
        });
      });

      it('url path map delete should remove url path map from application gateway', function (done) {
        var cmd = ('network application-gateway url-path-map delete {group} {name} ' +
          '{urlPathMapName} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);

          _.some(appGateway.probes, function (map) {
            return map.name === gatewayProp.urlPathMapName;
          }).should.be.false;

          networkTestUtil.shouldBeSucceeded(appGateway);
          done();
        });
      });

      it('redirect-config delete command should remove first redirect config from application gateway', function (done) {
        var cmd = ('network application-gateway redirect-config delete {group} {name} {redirectConfigName01} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          _.some(appGateway.redirectConfigurations, function (config) {
            return config.name === gatewayProp.redirectConfigName01;
          }).should.be.false;

          done();
        });
      });

      it('redirect-config delete command should remove second redirect config from application gateway', function (done) {
        var cmd = ('network application-gateway redirect-config delete {group} {name} {redirectConfigName02} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          _.some(appGateway.redirectConfigurations, function (config) {
            return config.name === gatewayProp.redirectConfigName02;
          }).should.be.false;

          done();
        });
      });

      it('http-listener delete command should remove http listener from application gateway', function (done) {
        var cmd = ('network application-gateway http-listener delete {group} {name} {httpListenerName} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          _.some(appGateway.httpListeners, function (listener) {
            return listener.name === gatewayProp.httpListenerName;
          }).should.be.false;

          done();
        });
      });

      it('frontend-port delete command should remove frontend port from application gateway', function (done) {
        var cmd = ('network application-gateway frontend-port delete {group} {name} {frontendPortName} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          _.some(appGateway.frontendPorts, function (port) {
            return port.name === gatewayProp.frontendPortName;
          }).should.be.false;

          done();
        });
      });

      it('frontend-ip delete command should remove frontend ip from application gateway', function (done) {
        var cmd = ('network application-gateway frontend-ip delete {group} {name} {frontendIpName} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          _.some(appGateway.frontendIPConfigurations, function (ip) {
            return ip.name === gatewayProp.frontendIpName;
          }).should.be.false;

          done();
        });
      });

      it('http-settings delete should remove http settings from application gateway', function (done) {
        var cmd = ('network application-gateway http-settings delete {group} {name} ' +
          '{httpSettingsName} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          _.some(appGateway.backendHttpSettingsCollection, function (setting) {
            return setting.name === gatewayProp.httpSettingsName;
          }).should.be.false;

          networkTestUtil.shouldBeSucceeded(appGateway);
          done();
        });
      });

      it('address-pool delete should remove address pool from application gateway', function (done) {
        var cmd = ('network application-gateway address-pool delete {group} {name} ' +
          '{poolName} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          _.some(appGateway.backendAddressPools, function (pool) {
            return pool.name === gatewayProp.poolName;
          }).should.be.false;

          networkTestUtil.shouldBeSucceeded(appGateway);
          done();
        });
      });

      it('waf-config create should create application gateway waf config', function (done) {
        var cmd = ('network application-gateway set -g {group} --sku-name {wafSkuName} ' +
          '--sku-tier {wafSkuTier} --name {name} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = ('network application-gateway waf-config create -g {group} --waf-mode {firewallMode} ' +
            '--enable {firewallEnabled} --gateway-name {name} --rule-set-type {ruleSetType} --rule-set-version {ruleSetVersion} ' +
            '--json').formatArgs(gatewayProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);

            var output = JSON.parse(result.text);
            output.firewallMode.should.equal(gatewayProp.firewallMode);
            output.enabled.should.equal(gatewayProp.firewallEnabled);

            done();
          });
        });
      });

      it('disabled-rule-group create should create new disabled rule group', function (done) {
        var cmd = ('network application-gateway waf-config disabled-rule-group create ' +
          '-n {disabledRuleGroupName} -g {group} --gateway-name {name} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.disabledRuleGroups.should.not.be.empty;

          _.some(output.disabledRuleGroups, function (group) {
            return group.ruleGroupName.toLowerCase() === gatewayProp.disabledRuleGroupName.toLowerCase() && !group.rules;
          }).should.be.true;

          done();
        });
      });

      it('disabled-rule-group show should show disabled rule group', function (done) {
        var cmd = ('network application-gateway waf-config disabled-rule-group show ' +
          '-n {disabledRuleGroupName} -g {group} --gateway-name {name} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ruleGroupName.toLowerCase().should.equal(gatewayProp.disabledRuleGroupName.toLowerCase());
          should.not.exist(output.rules);

          done();
        });
      });

      it('disabled-rule-group list should list all disabled rule groups', function (done) {
        var cmd = ('network application-gateway waf-config disabled-rule-group list ' +
          '-g {group} --gateway-name {name} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.should.not.be.empty;

          _.some(output, function (group) {
            return group.ruleGroupName.toLowerCase() === gatewayProp.disabledRuleGroupName.toLowerCase() && !group.rules;
          }).should.be.true;

          done();
        });
      });

      it('disabled-rule-group set should modify disabled rule group', function (done) {
        var cmd = ('network application-gateway waf-config disabled-rule-group set ' +
          '-n {disabledRuleGroupName} -r {disabledRuleGroupRules} -g {group} --gateway-name {name} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.should.not.be.empty;
          output.disabledRuleGroups.should.not.be.empty;

          _.some(output.disabledRuleGroups, function (group) {
            return group.ruleGroupName.toLowerCase() === gatewayProp.disabledRuleGroupName.toLowerCase() 
                && group.rules.join(',').toLowerCase() === gatewayProp.disabledRuleGroupRules.toLowerCase();
          }).should.be.true;
          
          done();
        });
      });

      it('disabled-rule-group show should show modified disabled rule group', function (done) {
        var cmd = ('network application-gateway waf-config disabled-rule-group show ' +
          '-n {disabledRuleGroupName} -g {group} --gateway-name {name} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.ruleGroupName.toLowerCase().should.equal(gatewayProp.disabledRuleGroupName.toLowerCase());
          output.rules.join(',').toLowerCase().should.equal(gatewayProp.disabledRuleGroupRules.toLowerCase());

          cmd = 'network application-gateway waf-config show -g {group} --gateway-name {name} --json'.formatArgs(gatewayProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);

            output.disabledRuleGroups.should.not.be.empty;

            _.some(output.disabledRuleGroups, function (group) {
              return group.ruleGroupName.toLowerCase() === gatewayProp.disabledRuleGroupName.toLowerCase() 
                  && group.rules.join(',').toLowerCase() === gatewayProp.disabledRuleGroupRules.toLowerCase();
            }).should.be.true;
            
            done();
          });
        });
      });

      it('disabled-rule-group delete should delete disabled rule group', function (done) {
        var cmd = ('network application-gateway waf-config disabled-rule-group delete ' +
          '-n {disabledRuleGroupName} -g {group} --gateway-name {name} --quiet --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.should.not.be.empty;
          output.disabledRuleGroups.should.be.empty;

          cmd = 'network application-gateway waf-config show -g {group} --gateway-name {name} --json'.formatArgs(gatewayProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);

            output.should.not.be.empty;
            output.disabledRuleGroups.should.be.empty;
            
            done();
          });
        });
      });

      it('waf-config delete should delete application gateway waf config', function (done) {
        var cmd = 'network application-gateway waf-config delete -g {group} --quiet --gateway-name {name} --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);

          cmd = 'network application-gateway waf-config show -g {group} --gateway-name {name} --json'.formatArgs(gatewayProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);

            var output = JSON.parse(result.text);
            output.should.be.empty;

            done();
          });
        });
      });

      it('delete should delete application gateway', function (done) {
        var cmd = 'network application-gateway delete {group} {name} --quiet --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

      it('create again should pass', function (done) {
        var cmd = ('network application-gateway create {group} {name} -l {location} -e {vnetName} -m {subnetName} ' +
          '-r {servers} -y {defaultSslCertPath} -x {sslPassword} -i {httpSettingsProtocol} -o {httpSettingsPortAddress} ' +
          '-f {cookieBasedAffinity} -j {portValue} -b {httpListenerProtocol} -w {ruleType} -a {skuName} -u {skuTier} ' +
          '-z {capacity} -t {tags} -O {httpSettingsName} -L {httpListenerName} -J {portName} -F {frontendIpName} ' +
          '-A {poolName} -G {createConfigName} -R {ruleName} --json').formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var appGateway = JSON.parse(result.text);

          appGateway.name.should.equal(gatewayProp.name);
          appGateway.location.should.equal(gatewayProp.location);
          appGateway.sku.name.should.equal(gatewayProp.skuName);
          appGateway.sku.tier.should.equal(gatewayProp.skuTier);
          appGateway.sku.capacity.should.equal(gatewayProp.capacity);

          _.some(appGateway.gatewayIPConfigurations, function (ipConfig) {
            return ipConfig.name === gatewayProp.createConfigName;
          }).should.be.true;

          _.some(appGateway.sslCertificates, function(sslCert) {
            return sslCert.name === gatewayProp.defSslCertName;
          }).should.be.true;

          _.some(appGateway.frontendIPConfigurations, function(frontendIP) {
            return frontendIP.name === gatewayProp.frontendIpName;
          }).should.be.true;

          _.some(appGateway.frontendPorts, function(frontendPort) {
            return frontendPort.name === gatewayProp.portName;
          }).should.be.true;

          _.some(appGateway.backendAddressPools, function(addressPool) {
            return addressPool.name === gatewayProp.poolName;
          }).should.be.true;

          _.some(appGateway.backendHttpSettingsCollection, function(settings) {
            return settings.name === gatewayProp.httpSettingsName
                && settings.port === gatewayProp.httpSettingsPortAddress
                && settings.protocol.toLowerCase() === gatewayProp.httpSettingsProtocol.toLowerCase()
                && settings.cookieBasedAffinity === gatewayProp.cookieBasedAffinity;
          }).should.be.true;

          _.some(appGateway.httpListeners, function(listener) {
            return listener.name.toLowerCase() === gatewayProp.httpListenerName.toLowerCase()
                && listener.protocol.toLowerCase() === gatewayProp.httpListenerProtocol.toLowerCase();
          }).should.be.true;

          networkTestUtil.shouldHaveTags(appGateway);
          networkTestUtil.shouldBeSucceeded(appGateway);
          done();
        });
      });

      it('delete should delete application gateway without waiting', function (done) {
        var cmd = 'network application-gateway delete {group} {name} -q --nowait --json'.formatArgs(gatewayProp);
        testUtils.executeCommand(suite, retry, cmd, function (deleteResult) {
          deleteResult.exitStatus.should.equal(0);

          cmd = 'network application-gateway show {group} {name} --json'.formatArgs(gatewayProp);
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            var output = JSON.parse(result.text);
            output.should.be.empty;
            done();
          });
        });
      });

      it('ssl-policy list-available should list available ssl policies', function (done) {
        var cmd = 'network application-gateway ssl-policy list-available --json';
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.defaultPolicy.should.be.String;
          output.predefinedPolicies.should.be.Array;
          output.availableProtocols.should.be.Array;
          output.availableCipherSuites.should.be.Array;

          done();
        });
      });

      it('ssl-policy predefined list and show should list and show predefined policies', function (done) {
        var cmd = 'network application-gateway ssl-policy predefined list --json';
        testUtils.executeCommand(suite, retry, cmd, function (result) {
          result.exitStatus.should.equal(0);
          var output = JSON.parse(result.text);

          output.should.be.Array;
          var policyName = output[0].name;

          cmd = 'network application-gateway ssl-policy predefined show ' + policyName + ' --json';
          testUtils.executeCommand(suite, retry, cmd, function (result) {
            result.exitStatus.should.equal(0);
            output = JSON.parse(result.text);

            output.name.should.be.equal(policyName);
            output.minProtocolVersion.should.be.String;
            output.cipherSuites.should.be.Array;

            done();
          });
        });
      });
    });
  });
});