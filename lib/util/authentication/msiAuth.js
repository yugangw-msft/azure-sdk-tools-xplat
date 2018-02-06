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

var util = require('util');
var _ = require('underscore');

var request = require('request');

var TokenCredentials = require('./tokenCredentials');
var utils = require('../utils');
var $ = utils.getLocaleString;

function MsiTokenCredentials(resource, port) {
  this._resource = resource;
  this._port = port;
}

util.inherits(MsiTokenCredentials, TokenCredentials);

//'retrieveTokenFromCache' is confusing, but for the sake of conforming to the interface.
MsiTokenCredentials.prototype.retrieveTokenFromCache = function (callback) {
  var self = this;
  var options = {
    url: util.format($('http://localhost:%s/oauth2/token'), self._port),
    headers: {
      'Metadata': 'true'
    },
    form: {
      'resource': self._resource
    }
  };
  request.post(options, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return callback(err);
    }
    var entry = JSON.parse(body)
    return callback(null, entry.token_type, entry.access_token);
  });
}
  ;
_.extend(exports, {
  MsiTokenCredentials: MsiTokenCredentials,
});
