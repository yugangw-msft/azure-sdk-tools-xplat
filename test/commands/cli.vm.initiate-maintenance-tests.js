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
var should = require('should');
var util = require('util');
var testUtils = require('../util/util');
var CLITest = require('../framework/cli-test');
var vmTestUtil = require('../util/asmVMTestUtil');

var suite;
var vmPrefix = 'clitestvm';
var testPrefix = 'cli.vm.initiate-maintenance-tests';
var createdVms = [];

var requiredEnvironment = [{
    name: 'AZURE_VM_TEST_LOCATION',
    defaultValue: 'Central US EUAP' //'East US 2 (Stage)'//'West US'
}];

describe('cli', function () {
    describe('vm', function () {
        var vmName,
            location,
            username = 'azureuser',
            password = 'Collabera@01',
            retry = 5,
            timeout;
        testUtils.TIMEOUT_INTERVAL = 5000;
        var vmUtil = new vmTestUtil();

        before(function (done) {
            suite = new CLITest(this, testPrefix, requiredEnvironment);
            suite.setupSuite(function () {
                vmName = suite.generateId(vmPrefix, createdVms);
                location = process.env.AZURE_VM_TEST_LOCATION;
                timeout = suite.isPlayback() ? 0 : testUtils.TIMEOUT_INTERVAL;
                done();
            });

        });

        after(function (done) {
            function deleteUsedVM(callback) {
                if (!suite.isPlayback()) {
                    setTimeout(function () {
                        var cmd = util.format('vm delete %s -b -q --json', vmName).split(' ');
                        testUtils.executeCommand(suite, retry, cmd, function (result) {
                            result.exitStatus.should.equal(0);
                            setTimeout(callback, timeout);
                        });
                    }, timeout);
                } else
                    callback();
            }

            deleteUsedVM(function () {
                suite.teardownSuite(done);
            });
        });

        beforeEach(function (done) {
            suite.setupTest(done);
        });

        afterEach(function (done) {
            setTimeout(function () {
                suite.teardownTest(done);
            }, timeout);
        });

        describe('Vm:', function () {
            it('initiate maintenance', function (done) {
                vmUtil.createWindowsVM(vmName, username, password, location, timeout, suite, function () {
                    setTimeout(function () {
                        var cmd = util.format('vm show %s --json', vmName).split(' ');
                        testUtils.executeCommand(suite, retry, cmd, function (result) {
                            result.exitStatus.should.equal(0);
                            var vmObj = JSON.parse(result.text);
                            vmObj.MaintenanceStatus.should.not.be.null;

                            var cmd = util.format('compute virtual-machine initiate-maintenance --service-name %s --name %s --virtual-machine-name %s --json -vv',
                                vmName, vmName, vmName).split(' '); 
                            testUtils.executeCommand(suite, retry, cmd, function (result) {
                                var check = ((result.exitStatus === 0) ||
                                    (result.text.includes("The server encountered an internal error. Please retry the request.")) ||
                                    (result.text.includes("User initiated maintenance on the Virtual Machine was successfully completed."))); // Depending on if the OS is new or old.
                                check.should.be.true;

                                var cmd = util.format('vm show %s --json', vmName).split(' ');
                                testUtils.executeCommand(suite, retry, cmd, function (result) {
                                    var vmObj = JSON.parse(result.text);
                                    vmObj.MaintenanceStatus.should.not.be.null;
                                    result.exitStatus.should.equal(0);
                                    
                                    var cmd = util.format('compute virtual-machine get-remote-desktop-file --service-name %s --name %s --virtual-machine-name %s --json -vv',
                                        vmName, vmName, vmName).split(' '); 
                                    testUtils.executeCommand(suite, retry, cmd, function (result) {
                                        var check = ((result.exitStatus !== 0) ||
                                            (result.text.includes("An external endpoint to the Remote Desktop port (3389) must first be added to the role.")));
                                        check.should.be.true;
                                        
                                        var cmd = util.format('compute virtual-machine redeploy --service-name %s --name %s --virtual-machine-name %s --json -vv',
                                        vmName, vmName, vmName).split(' '); 
                                        testUtils.executeCommand(suite, retry, cmd, function (result) {
                                            result.exitStatus.should.equal(0);
                                            
                                            var cmd = util.format('compute virtual-machine restart --service-name %s --name %s --virtual-machine-name %s --json -vv',
                                                vmName, vmName, vmName).split(' '); 
                                            testUtils.executeCommand(suite, retry, cmd, function (result) {
                                                result.exitStatus.should.equal(0);
                                                
                                                var cmd = util.format('compute virtual-machine start --service-name %s --name %s --virtual-machine-name %s --json -vv',
                                                    vmName, vmName, vmName).split(' '); 
                                                testUtils.executeCommand(suite, retry, cmd, function (result) {
                                                    result.exitStatus.should.equal(0);

                                                    var cmd = util.format('compute virtual-machine show --service-name %s --name %s --virtual-machine-name %s --json -vv',
                                                        vmName, vmName, vmName).split(' '); 
                                                    testUtils.executeCommand(suite, retry, cmd, function (result) {
                                                        result.exitStatus.should.equal(0);
                                                        var cmd = util.format('compute virtual-machine delete %s %s %s "" --json -vv',
                                                            vmName, vmName, vmName).split(' '); 
                                                        testUtils.executeCommand(suite, retry, cmd, function (result) {
                                                            var check = ((result.exitStatus !== 0) ||
                                                                (result.text.includes("Role " + vmName + "is the only role present in the deployment and so cannot be removed.")));
                                                            check.should.be.true;
                                                            done();
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }, 600000);//end of setTimeout. In prod, you need to wait 10min (600000ms) after the deployment has been created.
                });
            });
        });
    });
});