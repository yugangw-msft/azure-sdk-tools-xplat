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

var should = require('should');
const userAgentHeader = 'user-agent';

describe('cli', function () {
  describe('user-agent-filter', function () {
    var userAgentFilter = require('../../lib/util/cliUserAgentFilter');

    it('should set correct user agent string', function (done) {
      var resource = { headers: {} };

      var userAgentFunc = userAgentFilter.create('AzureXplatCLI');

      var mocknext = function (resource, cb) {
        return;
      };

      var callback = function () { return; }

      userAgentFunc(resource, mocknext, callback);

      resource.should.be.ok;
      resource.headers[userAgentHeader].should.eql('AzureXplatCLI');
      done();
    });

    it('should overwrite and set correct user agent string', function (done) {
      var resource = {
        headers: {
          'user-agent': "Some-Custom-Header"
        }
      };

      var userAgentFunc = userAgentFilter.create('AzureXplatCLI');

      var mocknext = function (resource, cb) {
        return;
      };

      var callback = function () { return; }

      userAgentFunc(resource, mocknext, callback);

      resource.should.be.ok;
      resource.headers[userAgentHeader].should.eql('AzureXplatCLI');
      done();
    });
  })
});
