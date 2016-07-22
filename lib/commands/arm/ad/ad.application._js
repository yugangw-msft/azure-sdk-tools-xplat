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
var util = require('util');
var moment = require('moment');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);

  var ad = cli.category('ad')
    .description($('Commands to display Active Directory objects'));
  var adApp = ad.category('app')
    .description($('Commands to display Active Directory applications'));

  adApp.command('create [name] [home-page] [identifier-uris]')
    .description($('Creates a new Active Directory application'))
    .usage('[options] <name> <home-page> <identifier-uris>')
    .option('-n --name <name>', $('the display name for the application'))
    .option('-m --home-page <home-page>', $('the URL to the application homepage'))
    .option('-a --available', $('indicates if the application will be available to other tenants'))
    .option('-p --password <password>', $('the value for the password credential associated with the application that will be valid for one year by default'))
    .option('-i --identifier-uris <identifier-uris>', $('the comma-delimitied URIs that identify the application'))
    .option('-r --reply-urls <reply-urls>', $('the comma-delimitied application reply urls'))
    .option('--key-value <key-value>', $('the value for the key credentials associated with the application that will be valid for one year by default'))
    .option('--key-type <key-type>', $('the type of the key credentials associated with the application. Acceptable values are AsymmetricX509Cert, Password and Symmetric'))
    .option('--key-usage <key-usage>', $('the usage of the key credentials associated with the application. Acceptable values are Sign and Verify'))
    .option('--start-date <start-date>', $('the start date after which password or key would be valid. Default value is current time'))
    .option('--end-date <end-date>', $('the end date till which password or key is valid. Default value is one year after current time'))
    .execute(function (name, homePage, identifierUris, options, _) {
      var application = adUtils.createApplication(cli, name, homePage, identifierUris, options, _);
      cli.interaction.formatOutput(application, function (data) {
        if (data) {
          adUtils.displayAApplication(data, log);
        }
      });
    });

  adApp.command('set')
    .description($('Updates the properties of the created Active Directory application'))
    .option('-o --objectId <objectId>', $('the object id of the application to update. Either provide objectId or applicationId. objectId is more preferable.'))
    .option('-a --applicationId <applicationId>', $('the applicationId of the application to update. If you have created a service principal using this application then this will be the spn of the service principal.'))
    .option('-n --name <name>', $('the new display name for the application.'))
    .option('-m --home-page <home-page>', $('the new URL to the application homepage'))
    .option('-p --password <password>', $('new value for the password credential associated with the application that will be valid for one year by default'))
    .option('-i --identifier-uris <identifier-uris>', $('new comma-delimitied URI values that identify the application'))
    .option('-r --reply-urls <reply-urls>', $('new comma-delimitied application reply urls'))
    .option('--key-value <key-value>', $('new value for the key credentials associated with the application that will be valid for one year by default'))
    .option('--key-type <key-type>', $('new type of the key credentials associated with the application. Acceptable values are AsymmetricX509Cert, Password and Symmetric. Default value: AsymmetricX509Cert'))
    .option('--key-usage <key-usage>', $('new usage of the key credentials associated with the application. Acceptable values are Sign and Verify. Default value: Verify'))
    .option('--start-date <start-date>', $('new start date value after which password or key would be valid. Default value is current time'))
    .option('--end-date <end-date>', $('new end date value till which password or key is valid. Default value is one year after current time'))
    .execute(function (options, _) {

      var applicationId = options.applicationId,
          objectId = options.objectId;
      var startDate = options.startDate ? new Date(Date.parse(options.startDate)) : new Date(Date.now());
      var endDate = (function () {
        if (options.endDate) {
          return new Date(Date.parse(options.endDate));
        } else {
          var date = new Date(startDate);
          var m = moment(date);
          m.add(1, 'years');
          date = new Date(m.toISOString());
          return date;
        }
      })();

      var keyType = options.keyType ? options.keyType : 'AsymmetricX509Cert';
      var keyUsage = options.keyUsage ? options.keyUsage : 'Verify';

      var appParams = {};
      if (options) {
        if (options.available) {
          appParams.availableToOtherTenants = true;
        }
        if (options.name) {
          appParams.displayName = options.name;
        }

        if (options.homePage) {
          appParams.homepage = options.homePage;
        }

        if (options.identifierUris) {
          appParams.identifierUris = options.identifierUris.split(',');
        }

        if (options.replyUrls) {
          appParams.replyUrls = options.replyUrls.split(',');
        }

        if (options.password) {
          appParams.passwordCredentials = [{
            startDate: startDate,
            endDate: endDate,
            keyId: utils.uuidGen(),
            value: options.password
          }];
        }

        if (options.keyValue) {
          appParams.keyCredentials = [{
            startDate: startDate,
            endDate: endDate,
            keyId: utils.uuidGen(),
            value: options.keyValue,
            usage: keyUsage,
            type: keyType
          }];
        }
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);

      var application = null;
      var applications = [];
      try {
        if (applicationId && !objectId) {
          var parameters = { filter: 'appId eq \'' + applicationId + '\'' };
          applications = client.applications.list(parameters, _);
          if (!applications || (applications && applications.length === 0)) {
            throw new Error($(util.format('The provided applicationId: \'%s\' was not found. Hence the application cannot be updated. ' + 
              'If you are not sure, then please execute \'azure ad app list\' and find out the correct applicationId or objectId.', applicationId)));
          }
          objectId = applications[0].objectId;
        }
        application = withProgress(util.format($('Updating application with objectId: \'%s\'.'), objectId),
        function (log, _) {
          return client.applications.patch(objectId, appParams, _);
        }, _);
      } catch (ex) {
        if (ex.statusCode && ex.statusCode === 403) {
          // Check if the User is a Guest user
          var currentUserObject = client.objects.getCurrentUser(_);
          if (currentUserObject && currentUserObject.userType && currentUserObject.userType === 'Guest') {
            throw new Error($('Updating an application is not allowed for a Guest user. Please contact your administrator to be added as a member in your tenant.'));
          }
        }
        throw ex;
      }

      cli.interaction.formatOutput(application, function (data) {
        if (data) {
          adUtils.displayAApplication(data, log);
        }
      });
    });

  adApp.command('delete [objectId]')
    .description($('Deletes the Active Directory application'))
    .usage('[options] <object-id>')
    .option('-o --objectId <objectId>', $('the object id of the application to remove'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .execute(function (objectId, options, _) {
      if (!objectId) {
        return cli.missingArgument('objectId');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete application %s? [y/n] '), objectId), _)) {
        return;
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress(util.format($('Deleting application %s'), objectId));
      try {
        client.applications.deleteMethod(objectId, _);
      } finally {
        progress.end();
      }
    });

  adApp.command('list')
    .description($('Get all Active Directory applications in current subscription\'s tenant'))
    .execute(function (options, _) {

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var appParams = {};

      var applications = withProgress(util.format($('Listing applications')),
      function (log, _) {
        return client.applications.list(appParams, _);
      }, _);

      adUtils.displayApplications(applications, cli.interaction, log);
    });

  adApp.command('show')
    .description($('Get Active Directory applications'))
    .option('-a --applicationId <applicationId>', $('the name of the application to return'))
    .option('-o --objectId <objectId>', $('the object id of the application to return'))
    .option('-i --identifierUri <identifierUri>', $('the identifier uri of the application to return'))
    .option('-c --search <search>', $('search display name of the application starting with the provided value'))
    .execute(function (options, _) {
      var applicationId = options.applicationId,
          objectId = options.objectId,
          identifierUri = options.identifierUri,
          search = options.search;

      adUtils.validateParameters({
        applicationId: applicationId,
        objectId: objectId,
        identifierUri: identifierUri,
        search: search
      });

      var subscription = profile.current.getSubscription(options.subscription);
      var client = adUtils.getADGraphClient(subscription);
      var progress = cli.interaction.progress($('Getting Active Directory application(s)'));
      var applications = [];
      var parameters = null;
      try {
        if (applicationId) {
          parameters = { filter: 'appId eq \'' + applicationId + '\'' };
          applications = client.applications.list(parameters, _);
        } else if (objectId) {
          var app = client.applications.get(objectId, _);
          if (app) {
            applications.push(app);
          }
        } else if (identifierUri) {
          parameters = { filter: 'identifierUris/any(s:s eq \'' + identifierUri + '\')' };
          applications = client.applications.list(parameters, _);
        } else if (search) {
          parameters = { filter: 'startswith(displayName,\'' + search + '\')' };
          applications = client.applications.list(parameters, _);
        }
      } finally {
        progress.end();
      }

      if (applications.length > 0) {
        adUtils.displayApplications(applications, cli.interaction, log);
      } else {
        log.data($('No matching application was found'));
      }
    });
};
