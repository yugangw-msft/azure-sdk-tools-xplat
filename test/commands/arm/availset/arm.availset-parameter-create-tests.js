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
var path = require('path');
var fs = require('fs');
var util = require('util');
var profile = require('../../../../lib/util/profile');
var testUtils = require('../../../util/util');
var CLITest = require('../../../framework/arm-cli-test');
var testprefix = 'arm-cli-avail-parameter-create-tests';
var groupPrefix = 'xplatTstAvsGCreate';
var VMTestUtil = require('../../../util/vmTestUtil');
var requiredEnvironment = [{
  name: 'AZURE_VM_TEST_LOCATION',
  defaultValue: 'southeastasia'
}];

var groupName,
  avsPrefix5 = 'xplattestavs5',
  location,
  paramFileName = 'test/data/availParam1.json';
  
var makeCommandStr = function(component, verb, file, others) {
  var cmdFormat = 'availset config %s %s --parameter-file %s %s --json';
  return util.format(cmdFormat, component, verb, file, others ? others : '');
};

describe('arm', function() {
  describe('compute', function() {
    var suite, retry = 5;
    var vmTest = new VMTestUtil();
    before(function(done) {
      suite = new CLITest(this, testprefix, requiredEnvironment);
      suite.setupSuite(function() {
        location = process.env.AZURE_VM_TEST_LOCATION;
        groupName = suite.generateId(groupPrefix, null);
        avsPrefix5 = suite.isMocked ? avsPrefix5 : suite.generateId(avsPrefix5, null);
        done();
      });
    });

    after(function(done) {
      this.timeout(vmTest.timeoutLarge * 10);
      vmTest.deleteUsedGroup(groupName, suite, function(result) {
        suite.teardownSuite(done);
      });
    });

    beforeEach(function(done) {
      suite.setupTest(done);
    });

    afterEach(function(done) {
      suite.teardownTest(done);
    });

    describe('availset', function() {

      it('required resources (group) create should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.checkImagefile(function() {
          vmTest.createGroup(groupName, location, suite, function(result) {
            done();
          });
        });
      });

      it('create-or-update-parameter generate set and remove should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 10);
        vmTest.getVMSize(location, suite, function() {
          var cmd = util.format('availset config create --parameter-file %s', paramFileName).split(' ');
          testUtils.executeCommand(suite, retry, cmd, function(result) {
            result.exitStatus.should.equal(0);
            var cmd = makeCommandStr('availability-set', 'delete', paramFileName, '--statuses --tags --type --name --id --virtual-machines --sku').split(' ');
            testUtils.executeCommand(suite, retry, cmd, function(result) {
              result.exitStatus.should.equal(0);
              var cmd = makeCommandStr('availability-set', 'set', paramFileName, '--parse --platform-update-domain-count 3 --platform-fault-domain-count 2').split(' ');
              testUtils.executeCommand(suite, retry, cmd, function(result) {
                result.exitStatus.should.equal(0);
                var cmd = makeCommandStr('sku', 'set', paramFileName, util.format('--name %s', 'Aligned')).split(' ');
                testUtils.executeCommand(suite, retry, cmd, function(result) {
                  result.exitStatus.should.equal(0);
                  var cmd = makeCommandStr('availability-set', 'set', paramFileName, util.format('--name %s --location %s', avsPrefix5, location)).split(' ');
                  testUtils.executeCommand(suite, retry, cmd, function(result) {
                    result.exitStatus.should.equal(0);
                    var cmd = util.format('availset create-or-update -g %s -n %s --parameter-file %s', groupName, avsPrefix5, paramFileName).split(' ');
                    testUtils.executeCommand(suite, retry, cmd, function(result) {
                      result.exitStatus.should.equal(0);
                      result.text.should.containEql('Aligned');
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
      
      it('delete command should pass', function(done) {
        this.timeout(vmTest.timeoutLarge * 20);
        var cmd = util.format('availset delete --resource-group %s --name %s -q --json', groupName, avsPrefix5).split(' ');
        testUtils.executeCommand(suite, retry, cmd, function(result) {
          result.exitStatus.should.equal(0);
          done();
        });
      });

    });
  });
});
