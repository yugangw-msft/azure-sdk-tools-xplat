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
var profile = require('../../../../lib/util/profile');
var utils = require('../../../../lib/util/utils');
var webappUtils = require('../../../../lib/commands/arm/webapp/webappUtils');

var testPrefix = 'arm-cli-webapp-tests';

var sitename;
var createdSites = [];
var location = 'West US';
var createdGroups = [];
var createdResources = [];
var createdAppSettingsKeys = [];
var createdAppSettingsValues = [];

var hostingPlanName, groupName;
var appSettingKey, appSettingValue, finalAppSetting;
var client;
var updatedPHPValue = "7.0";

describe('arm', function () {
  var suite;

  before(function (done) {
    suite = new CLITest(this, testPrefix);
    suite.setupSuite(function () {
      sitename = suite.generateId('webappclitests', createdSites);
      groupName = suite.generateId('testrg1', createdGroups);
      appSettingKey = suite.generateId('testkey1', createdAppSettingsKeys);
      appSettingValue = suite.generateId('testval1', createdAppSettingsValues);
      finalAppSetting = appSettingKey + '=' + appSettingValue;
      var subscription = profile.current.getSubscription();
      client = webappUtils.createWebappManagementClient(subscription);
      if (!suite.isPlayback()) {
        suite.execute('group create %s --location %s --json', groupName, location, function (result) {
          result.exitStatus.should.equal(0);
          createHostingPlan(groupName, function (err, planId) {
            if (err) { return done(err); }
            done();
          });
        });
      } else {
        done();
      }
    });
  });

  after(function (done) {
    suite.teardownSuite(function () {
      if (!suite.isPlayback()) {
        createdGroups.forEach(function (item) {
          suite.execute('group delete %s --quiet --json', item, function (result) {
            result.exitStatus.should.equal(0);
            done();
          })
        });
      } else {
        done();
      }
    });
  });

  beforeEach(function (done) {
    suite.setupTest(done);
  });

  afterEach(function (done) {
    suite.teardownTest(done);
  });

  describe('webapp', function () {

    it('create should work', function (done) {
      suite.execute('webapp create %s %s %s %s --json', groupName, sitename, location, hostingPlanName, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('list should work', function (done) {
      suite.execute('webapp list %s --json', groupName, function (result) {
        result.exitStatus.should.equal(0);
        var output = JSON.parse(result.text);
        output.length.should.be.above(0);
        done();
      });
    });

    it('show should work', function (done) {
      suite.execute('webapp show %s %s --json', groupName, sitename, function (result) {
        result.exitStatus.should.equal(0);
        var webapp = JSON.parse(result.text);
        webapp.name.should.equal(sitename);
        done();
      });
    });

    it('config show should work', function (done) {
      suite.execute('webapp config show %s %s --json', groupName, sitename, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('config set should work', function (done) {
      suite.execute('webapp config set %s %s --phpversion %s --json', groupName, sitename, updatedPHPValue, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('config appsettings set should work', function (done) {
      suite.execute('webapp config appsettings set %s %s %s --json', groupName, sitename, finalAppSetting, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('config appsettings list should work', function (done) {
      suite.execute('webapp config appsettings list %s %s --json', groupName, sitename, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('config appsettings delete should work', function (done) {
      suite.execute('webapp config appsettings delete %s %s %s --json', groupName, sitename, appSettingKey, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('publishingprofile show should work', function (done) {
      suite.execute('webapp publishingprofile show %s %s --json', groupName, sitename, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('stop should work', function (done) {
      suite.execute('webapp stop %s %s --json', groupName, sitename, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('start should work', function (done) {
      suite.execute('webapp start %s %s --json', groupName, sitename, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('restart should work', function (done) {
      suite.execute('webapp restart %s %s --json', groupName, sitename, function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });

    it('delete should work', function (done) {
      suite.execute('webapp delete %s %s -q --json', groupName, createdSites[0], function (result) {
        result.exitStatus.should.equal(0);
        done();
      });
    });
  });


  function createHostingPlan(groupName, done) {
    hostingPlanName = suite.generateId(testPrefix, createdResources);

    var planParameters = {
      location: location,
      name: hostingPlanName,
      sku: {
        name: 'B1',
        sku: 'Basic',
        family: 'B',
        capacity: 1
      }
    };

    var result = client.serverFarms.createOrUpdateServerFarm(groupName, hostingPlanName, planParameters, function (err, planResource) {
      return done(err, planResource.id);
    });
  }
});