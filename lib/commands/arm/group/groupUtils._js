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

var __ = require('underscore');
var fs = require('fs');
var path = require('path');
var request = require('request');
var through = require('through');
var util = require('util');

var validation = require('../../../util/validation');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');

var $ = utils.getLocaleString;

exports.getGroup = function getGroup(client, name, callback) {
  client.resourceGroups.get(name, function (err, group) {
    if (err) {
      // 404 means doesn't exist
      if (err.statusCode === 404) {
        callback(null, null);
      } else {
        // some other error, let it out
        callback(err);
      }
    } else {
      // No error, group exists
      callback(null, group);
    }
  });
};

exports.getResource = function getResource(client, resourceGroup, identity, callback) {
  client.resources.get(resourceGroup, 
    identity.resourceProviderNamespace, 
    identity.parentResourcePath, 
    identity.resourceType,
    identity.resourceName,
    identity.resourceProviderApiVersion, function (err, resource) {
    if (err) {
      // 404 means doesn't exist
      if (err.statusCode === 404) {
        callback(null, null);
      } else {
        // some other error, let it out
        callback(err);
      }
    } else {
      // No error, resource exists
      callback(null, resource);
    }
  });
};

exports.createDeployment = function (cli, resourceGroup, name, options, _) {
  var subscription = profile.current.getSubscription(options.subscription);
  var client = utils.createResourceClient(subscription);

  var templateParameters = createDeploymentParameters(cli, subscription, resourceGroup, options, _);

  //if not provided, derive it from the template file name
  if (!name) {
    var templateName = options.templateFile || options.templateUri;
    var baseTemplateName = path.basename(templateName);
    //if the file extension is '.json', get rid of it.
    if (utils.stringEndsWith(baseTemplateName, '.json', true)) {
      baseTemplateName = path.basename(baseTemplateName, path.extname(baseTemplateName));
    }
    name = baseTemplateName;
  }

  var result = cli.interaction.withProgress($('Creating a deployment'),
    function (log, _) {
      var response = client.deployments.validate(resourceGroup, name, templateParameters, _);
        if (response.error) {
          log.error(util.format($('%s : %s'), response.error.code, response.error.message));
          if (response.error.details) {
            response.error.details.forEach(function (detail) {
              log.error(util.format($('%s : %s'), detail.code, detail.message));
            });
          }
          throw new Error('Deployment validate failed.');
        }
      //The new ARM node SDK doesn't get nested errors. This needs to be fixed in the next release. Until then, CLI command will handle bubbling up the errors.
      return client.deployments.beginCreateOrUpdate(resourceGroup, name, templateParameters, _);
    }, _);

  cli.output.info(util.format($('Created template deployment "%s"'), name));

  return result;

};

exports.validateTemplate = function (cli, resourceGroup, options, log, _) {
  var subscription = profile.current.getSubscription(options.subscription);
  var client = utils.createResourceClient(subscription);

  var templateParameters = createDeploymentParameters(cli, subscription, resourceGroup, options, _);

  var response = cli.interaction.withProgress($('Validating the template'),
    function (log, _) {
      return client.deployments.validate(resourceGroup, 'fakedDeploymentName', templateParameters, _);
    }, _);

  response.requiredProviders = getTemplateProviders(response);

  if (response.error) {
    log.error(util.format($('%s : %s'), response.error.code, response.error.message));
    if (response.error.details) {
      response.error.details.forEach(function (detail) {
        log.error(util.format($('%s : %s'), detail.code, detail.message));
      });
    }
  }

  return response;
};

exports.getTemplateDownloadUrl = function getTemplateDownloadUrl(templateData) {
  //TODO, simplify with build-in support
  var urls = [];
  templateData.artifacts.forEach(function (e) {
    if (e.type === 'template') {
      urls.push({
        name: e.name,
        uri: e.uri
      });
    }
  });
  return urls;
};

exports.getAllEvents = function (subscription, groupName) {
  var output = through();
  var client = utils.createEventsClient(subscription);

  client.eventData.listEventsForResourceGroup({
    resourceGroupName: groupName,
    startTime: new Date(Date.now() - eventRetentionPeriodMS),
    endTime: new Date()
  }, function (err, response) {
    if (err) {
      return output.emit('error', err);
    }

    response.eventDataCollection.value.forEach(function (e) {
      output.queue(e);
    });
    output.end();
  });
  return output;
};

exports.getDeploymentLog = function (subscription, name, deploymentName) {
  var output = through();
  var client = utils.createResourceClient(subscription);

  client.deployments.get(name, deploymentName, function (err, result) {
    if (err) {
      return output.emit('error', err);
    }
    getDeploymentLogs(subscription, result.properties.correlationId).pipe(output);
  });
  return output;
};

exports.getLastDeploymentLog = function (subscription, name) {
  var output = through();
  var client = utils.createResourceClient(subscription);

  client.deployments.list(name, { top: 1 }, function (err, response) {
    if (err) { return output.emit('error', err); }
    if (response.length === 0) {
      output.emit('error', new Error($('Deployment not found')));
    }
    getDeploymentLogs(subscription, response[0].properties.correlationId).pipe(output);
  });
  return output;
};

exports.normalizeDownloadFileName = function normalizeDownloadFileName(downloadFile, quiet, confirmer, callback) {
  function ensureDirExists(dirname) {
    if (!dirname) {
      return;
    }

    if (utils.pathExistsSync(dirname)) {
      if (!fs.statSync(dirname).isDirectory()) {
        throw new Error(util.format($('Path %s already exists and is not a directory.'), dirname));
      }
      return;
    }

    ensureDirExists(path.dirname(dirname));
    fs.mkdirSync(dirname);
  }

  try {
    ensureDirExists(path.dirname(downloadFile));
    if (utils.pathExistsSync(downloadFile) && !quiet) {
      confirmer(
        util.format($('The file %s already exists. Overwrite? [y/n]: '), downloadFile),
          function (err, confirmed) {
            if (confirmed) {
              callback(null, downloadFile);
            } else {
              callback(null, null);
            }
          }
      );
    } else {
      callback(null, downloadFile);
    }
  } catch (ex) {
    callback(ex);
  }
};

function createDeploymentParameters(cli, subscription, resourceGroup, options, _) {
  var templateOptions = [options.templateFile, options.templateUri];
  var templateOptionsProvided = templateOptions.filter(function (value) { return value !== undefined; }).length;
  if (templateOptionsProvided > 1) {
    throw new Error($('Specify exactly one of the --template-file, or template-uri options.'));
  } else if (templateOptionsProvided === 0) {
    throw new Error($('One of the --template-file, or --template-uri options is required.'));
  }

  if (options.parameters && options.parametersFile) {
    throw new Error($('Either --parameters or --parameters-file need to be specified. Not both.'));
  }

  var deploymentParameters;
  if (options.parametersFile) {
    var jsonFile = fs.readFileSync(options.parametersFile, 'utf8');
    deploymentParameters = JSON.parse(utils.stripBOM(jsonFile));
    // Handle v2 version of parameters file that has $schema
    if (deploymentParameters.parameters) {
      deploymentParameters = deploymentParameters.parameters;
    }
  } else if (options.parameters) {
    deploymentParameters = JSON.parse(options.parameters);
  } else {
    var log = cli.output;
    log.info('Supply values for the following parameters');
    var paramsRequired = getTemplateParams(cli, subscription, options, _);
    deploymentParameters = {};

    Object.keys(paramsRequired).forEach_(_, 1, function (_, key) {
      var val = {};
      val['value'] = paramsRequired[key];
      deploymentParameters[key] = val;
    });

  }

  var templateParameters = {};
  if (options.mode) {
    templateParameters['properties'] = { mode: options.mode.toString() };
  }
  else {
    templateParameters['properties'] = { mode: 'Incremental' };
  }

  if (options.debugSetting) {
    switch (options.debugSetting.toString().toLowerCase()) {
      case 'requestcontent':
        templateParameters['properties']['debugSetting'] = { detailLevel: 'RequestContent' };
        break;

      case 'responsecontent':
        templateParameters['properties']['debugSetting'] = { detailLevel: 'ResponseContent' };
        break;

      case 'all':
        templateParameters['properties']['debugSetting'] = { detailLevel: 'RequestContent,ResponseContent' };
        break;

      default:
        break;
    }
  }
  
  cli.interaction.withProgress($('Initializing template configurations and parameters'),
    function (log, _) {

      var templateUri = options.templateUri;
      if (!templateUri) {
        var templateContent = getTemplateContent(subscription, options.templateFile, _);
        templateParameters['properties']['template'] = templateContent;
      } else {
        templateParameters['properties']['templateLink'] = { uri: templateUri };
        if (options.templateVersion) {
          templateParameters.properties.templateLink.contentVersion = options.templateVersion;
        }
      }

      if (deploymentParameters) {
        templateParameters.properties.parameters = deploymentParameters;
      }

    }, _);
  return templateParameters;
}

var eventRetentionPeriodMS = 89 * 24 * 60 * 60 * 1000; // 89 days in milliseconds

function getDeploymentLogs(subscription, correlationId) {
  var output = through();
  var client = utils.createEventsClient(subscription);
  client.eventData.listEventsForCorrelationId({
    correlationId: correlationId,
    startTime: new Date(Date.now() - eventRetentionPeriodMS),
    endTime: new Date()
  }, function (err, response) {
    if (err) {
      return output.emit('error', err);
    }
    response.eventDataCollection.value.forEach(function (e) {
      output.queue(e);
    });
    output.end();
  });
  return output;
}

function getTemplateProviders(validationResponse) {
  if (validationResponse.properties && validationResponse.properties.providers) {
    return __.map(validationResponse.properties.providers, function (provider) {
      if (provider.namespace) {
        return provider.namespace.toLowerCase();
      }
    });
  }
}

function getTemplateContent(subscription, templateFile, _) {
  function readTemplateFileContentFromUri(templateFileUri, callback) {
    request(templateFileUri, function (error, response, body) {
      callback(error, body);//need to filter on some errors?
    });
  }

  var templateFileUri;
  if (templateFile) {
    if (validation.isURL(templateFile)) {
      templateFileUri = templateFile;
    }
  }

  var content = {};
  if (templateFileUri) {
    content = readTemplateFileContentFromUri(templateFileUri, _);
  } else if (templateFile) {
    content = utils.stripBOM(fs.readFileSync(templateFile));
  }

  return JSON.parse(content);
}

function getTemplateParams(cli, subscription, options, _)
{
  var templateContent = options.templateFile ?
    getTemplateContent(subscription, options.templateFile, _) :
    getTemplateContent(subscription, options.templateUri, _);

  var paramKeys = {};
  if (templateContent.parameters) {
    Object.keys(templateContent.parameters).forEach_(_, 1, function (_, param) {
      paramKeys[param] = templateContent.parameters[param].defaultValue;
      if (!templateContent.parameters[param].defaultValue) {
        paramKeys[param] = cli.interaction.promptIfNotGiven(param + ': ', paramKeys[param], _);
        switch (templateContent.parameters[param].type.toLowerCase()) {
          case 'int':
            paramKeys[param] = utils.parseInt(paramKeys[param]);
            break;

          case 'object':
          case 'bool':
          case 'array':
            paramKeys[param] = JSON.parse(paramKeys[param]);
            break;
        }
      }
    });
  }
  
  return paramKeys;
}

exports.getFailedDeploymentOperations = function (subscription, resourceGroup, deploymentName, _) {
  var currentSubscription = profile.current.getSubscription(subscription);
  var client = utils.createResourceClient(currentSubscription);
  var operations = client.deploymentOperations.list(resourceGroup, deploymentName, _);
  var failedOperations = getFailedNestedOperations(client, resourceGroup, operations, _);
  return failedOperations;
};

function getFailedNestedOperations(client, resourceGroup, currentOperations, _) {
  var newOperations = [];
  currentOperations.forEach_(_, 1, function (_, operation) {
    //If current operation has a nested deployment, idenitified by target resource, get failed operations of that nested deployment as well
    if (operation.properties.provisioningState === 'Failed') {
      newOperations.push(operation);
      if (operation.properties.targetResource && operation.properties.targetResource.id.indexOf('Microsoft.Resources/deployments') !== -1) {
        var nestedDeployment = operation.properties.targetResource.resourceName;
        var nestedOperations = client.deploymentOperations.list(resourceGroup, nestedDeployment, _);
        var newNestedOperations = getFailedNestedOperations(client, resourceGroup, nestedOperations, _);
        newOperations.concat(newNestedOperations);
      }
    }
  });
  return newOperations;
}
