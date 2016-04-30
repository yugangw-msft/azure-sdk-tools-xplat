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
var adUtils = require('./adUtils');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  var ad = cli.category('ad')
    .description($('Commands to display Active Directory objects'));
  var adUser = ad.category('user')
    .description($('Commands to display Active Directory users'));

  adUser.command('list')
    .description($('Get all Active Directory users in current subscription\'s tenant'))
    .option('| more', $('Provides paging support. Press \'Enter\' for more information.'))
    .execute(function (options, _) {
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress($('Listing Active Directory users'));
      try {
        adUtils.listGraphObjects(client, 'user', cli.interaction, log, _);
      } finally {
        progress.end();
      }
    });

  adUser.command('show')
    .description($('Get an Active Directory user'))
    .option('--upn <upn>', $('the principal name of the user to return'))
    .option('--objectId <objectId>', $('the object id of the user to return'))
    .option('--search <search>', $('search users with display name starting with the provided value'))
    .execute(function (options, _) {
      var upn = options.upn,
          objectId = options.objectId,
          search = options.search;

      adUtils.validateParameters({
        upn: upn,
        objectId: objectId,
        search: search
      });
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress($('Getting Active Directory user'));
      var users = [];
      var parameters = null;
      try {
        if (upn) {
          parameters = { filter: 'userPrincipalName eq \'' + upn + '\'' };
          users = client.userOperations.list(parameters, _);
        } else if (objectId) {
          var user = client.userOperations.get(objectId, _);
          if (user) {
            users.push(user);
          }
        } else {
          parameters = { filter: 'startswith(displayName,\'' + search + '\')' };
          users = client.userOperations.list(parameters, _);
        }
      } finally {
        progress.end();
      }

      if (users.length > 0) {
        adUtils.displayUsers(users, cli.interaction, log);
      } else {
        log.error($('No matching user was found'));
      }
    });
};