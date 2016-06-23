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
var util = require('util');
var fs = require('fs')

var CLITest = require('../../../framework/arm-cli-test');
var log = require('../../../framework/test-logger');
var testUtil = require('../../../util/util');
var utils = require('../../../../lib/util/utils');

var testPrefix = 'arm-cli-devtestlabs-tests';

var testSubscription = process.env.AZURE_ARM_DEVTESTLABS_TEST_SUBSCRIPTION; // 33855c90-c8cf-44a0-a266-9b548fb8e7b0
var testResourceGroup = process.env.AZURE_ARM_DEVTESTLABS_TEST_RESOURCEGROUP; // 'KeepIntegrationTestResources';
var testLabName = process.env.AZURE_ARM_DEVTESTLABS_TEST_LABNAME;   // LabForIntegration

var requiredEnvironment = [{
  requiresToken: true
}, {
  name: 'AZURE_ARM_TEST_LOCATION',
  defaultValue: 'Southeast Asia'
}
];

describe('arm', function () {
  before(function (done) {
    suite = new CLITest(this, testPrefix, requiredEnvironment);
    suite.setupSuite(done);
  });

  after(function (done) {
    suite.teardownSuite(done);
  });

  beforeEach(function (done) {
    suite.setupTest(done);
  });

  afterEach(function (done) {
    suite.teardownTest(done);
  });
  
  // vms-per-lab-policy
  describe('set vms per lab policy', function () {
    it('Set vms per lab policy command should work', function (done) {
      var vmCount = 10000;
      suite.execute('lab vms-per-lab-policy set --resource-group %s --lab-name %s --vm-count %s --subscription %s', testResourceGroup, testLabName, vmCount, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });

    it('get vms per lab policy command should work', function (done) {
      suite.execute('lab vms-per-lab-policy show --resource-group %s --lab-name %s --subscription %s', testResourceGroup, testLabName, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
  });
  
  // vms-per-user-policy
  describe('set vms per user policy', function () {
    it('Set vms per user policy command should work', function (done) {
      var vmCount = 10000;
      suite.execute('lab vms-per-user-policy set --resource-group %s --lab-name %s --vm-count %s --subscription %s', testResourceGroup, testLabName, vmCount, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
    
    it('get vms per lab policy command should work', function (done) {
      suite.execute('lab vms-per-user-policy show --resource-group %s --lab-name %s --subscription %s', testResourceGroup, testLabName, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
  });

  // vm-size-policy
  describe('set vm size policy', function () {
    it('set vm size policy command should work', function (done) {
      var sizes = 'Standard_A0,Standard_A2';
      suite.execute('lab vm-size-policy set --resource-group %s --lab-name %s --vm-sizes %s --subscription %s', testResourceGroup, testLabName, sizes, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
    
    it('get vm size policy command should work', function (done) {
      suite.execute('lab vm-size-policy show --resource-group %s --lab-name %s --subscription %s', testResourceGroup, testLabName, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
  });

  // auto-shutdown-policy
  describe('set auto-shutdown policy', function () {
    it('set auto-shutdown policy command should work', function (done) {
      var time = '1525';
      suite.execute('lab auto-shutdown-policy set --resource-group %s --lab-name %s --time %s --subscription %s', testResourceGroup, testLabName, time, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
    
    it('get auto-shutdown policy command should work', function (done) {
      suite.execute('lab auto-shutdown-policy show --resource-group %s --lab-name %s --subscription %s', testResourceGroup, testLabName, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
  });

  // auto-start-policy
  describe('set auto-start policy', function () {
    it('set auto-start policy command should work', function (done) {
      var weekly = 'Monday,Friday';
      var time = '1810';
      suite.execute('lab auto-start-policy set --resource-group %s --lab-name %s --weekly %s --time %s --subscription %s', testResourceGroup, testLabName, weekly, time, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
    
    it('get auto-start policy command should work', function (done) {
      suite.execute('lab auto-start-policy show --resource-group %s --lab-name %s --subscription %s', testResourceGroup, testLabName, testSubscription, function (result) {
        result.exitStatus.should.be.equal(0);
        done();
      });
    });
  });
});