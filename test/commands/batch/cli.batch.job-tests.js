//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//
'use strict';

var should = require('should');
var utils = require('../../../lib/util/utils');
var CLITest = require('../../framework/arm-cli-test');

var jobScheduleId = 'xplatJobScheduleJobTests';
var jobId = 'xplatJob';

var path = require('path');
var createJobScheduleJsonFilePath = path.resolve(__dirname, '../../data/batchCreateJobScheduleForJobTests.json');
var createJsonFilePath = path.resolve(__dirname, '../../data/batchCreateJob.json');
var updateJsonFilePath = path.resolve(__dirname, '../../data/batchUpdateJob.json');

var requiredEnvironment = [
  { name: 'AZURE_BATCH_ACCOUNT', defaultValue: 'defaultaccount' },
  { name: 'AZURE_BATCH_ENDPOINT', defaultValue: 'https://defaultaccount.westus.batch.azure.com' }
];

var testPrefix = 'cli-batch-job-tests';
var suite;

var batchAccount;
var batchAccountKey;
var batchAccountEndpoint;

describe('cli', function () {
  describe('batch job', function () {
    before(function (done) {
      suite = new CLITest(this, testPrefix, requiredEnvironment);
      
      if (suite.isMocked) {
        utils.POLL_REQUEST_INTERVAL = 0;
      }

      suite.setupSuite(function () {
        batchAccount = process.env.AZURE_BATCH_ACCOUNT;
        if (suite.isPlayback()) {
          batchAccountKey = 'non null default value';
        } else {
          batchAccountKey = process.env.AZURE_BATCH_ACCESS_KEY;
        }
        batchAccountEndpoint = process.env.AZURE_BATCH_ENDPOINT;
        
        if (!suite.isPlayback()) {
          suite.execute('batch job-schedule create %s --account-name %s --account-key %s --account-endpoint %s --json', createJobScheduleJsonFilePath, 
          batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
            result.exitStatus.should.equal(0);
            done();
          });
        }
        else {
          done();
        }
      });
    });
    
    after(function (done) {
      if (!suite.isPlayback()) {
        suite.execute('batch job-schedule delete %s --account-name %s --account-key %s --account-endpoint %s --quiet --json', jobScheduleId, 
        batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
          result.exitStatus.should.equal(0);
        });
      }
      suite.teardownSuite(done);
    });
    
    beforeEach(function (done) {
      suite.setupTest(done);
    });
    
    afterEach(function (done) {
      suite.teardownTest(done);
    });
    
    it('should create a job from a json file', function (done) {
      suite.execute('batch job create %s --account-name %s --account-key %s --account-endpoint %s --json', createJsonFilePath, 
        batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
        result.exitStatus.should.equal(0);
        var createdJob = JSON.parse(result.text);
        createdJob.should.not.be.null;
        createdJob.id.should.equal(jobId);
        done();
      });
    });
    
    it('should list jobs under a batch account', function (done) {
      suite.execute('batch job list --account-name %s --account-key %s --account-endpoint %s --json', 
        batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
        result.exitStatus.should.equal(0);
        var jobs = JSON.parse(result.text);
        jobs.some(function (job) {
          return job.id === jobId;
        }).should.be.true;
        done();
      });
    });
    
    it('should list jobs under a job schedule', function (done) {
      suite.execute('batch job list --job-schedule-id %s --account-name %s --account-key %s --account-endpoint %s --json', 
        jobScheduleId, batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
        result.exitStatus.should.equal(0);
        var jobs = JSON.parse(result.text);
        jobs.every(function (job) {
          // Jobs created from a job schedule have ids of the format '<jobScheduleId>:job<number>'
          // We check to make sure the job id contains the job schedule id.
          return job.id.indexOf(jobScheduleId) != -1;
        }).should.be.true;
        jobs.every(function (job) {
          return job.id != jobId;
        }).should.be.true;
        done();
      });
    });

    it('should update the job using a json file', function (done) {
      // The update JSON should change the priority, so we store the original, perform the update,
      // and then ensure that the priority was in fact changed.
      suite.execute('batch job show %s --account-name %s --account-key %s --account-endpoint %s --json', jobId, 
        batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
        result.exitStatus.should.equal(0);
        var originalJob = JSON.parse(result.text);
        originalJob.priority.should.not.be.null;

        suite.execute('batch job set %s %s --account-name %s --account-key %s --account-endpoint %s --json', jobId, updateJsonFilePath, 
          batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
          result.exitStatus.should.equal(0);
          var updatedJob = JSON.parse(result.text);
          updatedJob.priority.should.not.be.null;
          updatedJob.priority.should.not.equal(originalJob.priority);

          done();
        });
      });
    });
    
    it('should delete the job', function (done) {
      suite.execute('batch job delete %s --account-name %s --account-key %s --account-endpoint %s --json --quiet', jobId, 
        batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
        result.exitStatus.should.equal(0);

        suite.execute('batch job show %s --account-name %s --account-key %s --account-endpoint %s --json', jobId, 
          batchAccount, batchAccountKey, batchAccountEndpoint, function (result) {
          if (result.exitStatus === 0) {
            var deletingJob = JSON.parse(result.text);
            deletingJob.state.should.equal('deleting');
          } else {
            result.text.should.equal('');
          }
          
          done();
        });
      });
    });
  });
});