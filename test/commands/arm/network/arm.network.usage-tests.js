﻿/**
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
var testprefix = 'arm-cli-network-usage-tests';

describe('arm', function () {
  describe('network', function () {
    var suite;
    before(function (done) {
      suite = new CLITest(this, testprefix);
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
    
    describe('network', function () {
      
      it('should list usage correctly', function (done) {
        suite.execute('network usage list westus --json', function (result) {
          result.exitStatus.should.equal(0);
          var usageInfo = JSON.parse(result.text);
          usageInfo.some(function (item) {
            if (item.name.value === 'NetworkSecurityGroups') {
              return item.limit >= 100;
            }
          }).should.be.true;
          done();
        });
      });
    });
  });
});