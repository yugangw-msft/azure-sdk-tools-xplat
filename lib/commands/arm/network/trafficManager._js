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

var __ = require('underscore');
var util = require('util');
var utils = require('../../../util/utils');
var $ = utils.getLocaleString;
var constants = require('./constants');
var resourceUtils = require('../resource/resourceUtils');
var tagUtils = require('../tag/tagUtils');

function TrafficManager(cli, trafficManagerManagementClient) {
  this.trafficManagerManagementClient = trafficManagerManagementClient;
  this.output = cli.output;
  this.interaction = cli.interaction;
}

__.extend(TrafficManager.prototype, {
  /**
   * TrafficManager Profile methods
   */
  createProfile: function (resourceGroupName, profileName, options, _) {
    var self = this;
    var profile = self.getProfile(resourceGroupName, profileName, _);
    if (profile) {
      throw new Error(util.format($('A Traffic Manager profile with name "%s" already exists in resource group "%s"'),
        profileName, resourceGroupName));
    }
    profile = {
      location: constants.trafficManager.defLocation,
      dnsConfig: {
        relativeName: options.relativeDnsName
      },
      monitorConfig: {},
      endpoints: []
    };
    var parameters = self._parseProfile(profile, options, true);
    var progress = self.interaction.progress(util.format($('Creating Traffic Manager profile "%s"'), profileName));
    try {
      profile = self.trafficManagerManagementClient.profiles.createOrUpdate(resourceGroupName, profileName, parameters, options, _);
    } finally {
      progress.end();
    }

    self._showProfile(resourceGroupName, profile);
  },

  setProfile: function (resourceGroupName, profileName, options, _) {
    var self = this;

    var profile = self.getProfile(resourceGroupName, profileName, _);
    if (!profile) {
      throw new Error(util.format($('A Traffic Manager profile with name "%s" not found in resource group "%s"'), profileName, resourceGroupName));
    }

    var parameters = self._parseProfile(profile, options, false);
    var progress = self.interaction.progress(util.format($('Updating Traffic Manager profile "%s"'), profileName));
    try {
      profile = self.trafficManagerManagementClient.profiles.createOrUpdate(resourceGroupName, profileName, parameters, null, _);
    } finally {
      progress.end();
    }

    self._showProfile(resourceGroupName, profile);
  },

  listProfiles: function (options, _) {
    var self = this;
    var progress = self.interaction.progress($('Getting Traffic Manager profiles'));
    var profiles = null;
    try {
      if (options.resourceGroup) {
        profiles = self.trafficManagerManagementClient.profiles.listByInResourceGroup(options.resourceGroup, _);
      } else {
        profiles = self.trafficManagerManagementClient.profiles.listAll(_);
      }
    } finally {
      progress.end();
    }
    self.interaction.formatOutput(profiles, function (profiles) {
      if (!profiles || profiles.length === 0) {
        self.output.warn(util.format($('No Traffic Manager profiles found in resource group "%s"'), options.resourceGroup));
      } else {
        self.output.table(profiles, function (row, profile) {

          row.cell($('Name'), profile.name);
          var resInfo = resourceUtils.getResourceInformation(profile.id);
          row.cell($('Resource group'), resInfo.resourceGroup);
          row.cell($('Status'), profile.profileStatus);
          row.cell($('DNS name'), profile.dnsConfig.relativeName);
          row.cell($('TTL'), profile.dnsConfig.ttl);
          row.cell($('Routing method'), profile.trafficRoutingMethod);
          row.cell($('Monitoring protocol'), profile.monitorConfig.protocol);
          row.cell($('Monitoring path'), profile.monitorConfig.path);
          row.cell($('Monitoring port'), profile.monitorConfig.port);
          row.cell($('Number of endpoints'), profile.endpoints.length || 0);
        });
      }
    });
  },

  showProfile: function (resourceGroupName, profileName, options, _) {
    var self = this;
    var profile = self.getProfile(resourceGroupName, profileName, _);

    self._showProfile(resourceGroupName, profile, profileName);
  },

  getProfile: function (resourceGroupName, profileName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up the Traffic Manager profile "%s"'), profileName));
    try {
      var profile = self.trafficManagerManagementClient.profiles.get(resourceGroupName, profileName, null, _);
      return profile;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  deleteProfile: function (resourceGroupName, profileName, options, _) {
    var self = this;
    var profile = self.getProfile(resourceGroupName, profileName, _);

    if (!profile) {
      throw new Error(util.format('Traffic Manager profile with name "%s" not found in the resource group "%s"', profileName, resourceGroupName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete Traffic Manager profile "%s" ? [y/n] '), profileName), _)) {
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting Traffic Manager profile "%s"'), profileName));
    try {
      self.trafficManagerManagementClient.profiles.deleteMethod(resourceGroupName, profileName, null, _);
    } finally {
      progress.end();
    }
  },

  checkDnsAvailability: function (relativeDnsName, options, _) {
    var self = this;
    var parameters = {
      name: relativeDnsName,
      type: 'Microsoft.Network/trafficManagerProfiles'
    };

    var progress = self.interaction.progress($('Checking DNS name availability'));
    var result;
    try {
      result = self.trafficManagerManagementClient.profiles.checkTrafficManagerRelativeDnsNameAvailability(parameters, _);
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(result, function (result) {
      if (result.nameAvailable === true) {
        self.output.info(util.format($('The DNS name "%s" is available'), result.name));
      } else {
        self.output.warn(result.message);
      }
    });
  },

  /**
   * TrafficManager Endpoints methods
   */
  createEndpoint: function (resourceGroupName, profileName, endpointName, options, _) {
    var self = this;
    utils.verifyParamExistsInCollection(constants.trafficManager.endpointType, options.type, '--type');

    if (utils.ignoreCaseEquals(options.type, constants.trafficManager.azureType)) {
      if (options.location) {
        throw new Error($('The --location should only be specified on endpoints of type \'ExternalEndpoints\' and \'NestedEndpoints\''));
      }
    } else {
      options.location = self.interaction.promptIfNotGiven($('Endpoint location: '), options.location, _);
    }

    var endpoint = self.getEndpoint(resourceGroupName, profileName, endpointName, options.type, _);
    if (endpoint) {
      throw new Error(util.format($('An endpoint with name "%s" already exists in Traffic Manager profile "%s"'), endpointName, profileName));
    }

    endpoint = {
      name: endpointName,
      properties: {}
    };

    var parameters = self._parseEndpoint(endpoint, options);
    var progress = self.interaction.progress(util.format($('Creating endpoint with name "%s" in Traffic Manager profile "%s"'), endpointName, profileName));
    try {
      endpoint = self.trafficManagerManagementClient.endpoints.createOrUpdate(resourceGroupName, profileName, options.type, endpointName, parameters, _);
    } finally {
      progress.end();
    }

    self._showEndpoint(profileName, endpointName, endpoint);
  },

  setEndpoint: function (resourceGroupName, profileName, endpointName, options, _) {
    var self = this;

    var endpoint = self.getEndpoint(resourceGroupName, profileName, endpointName, options.type, _);
    if (!endpoint) {
      throw new Error(util.format($('An endpoint with name "%s" not found in Traffic Manager profile "%s"'), endpointName, profileName));
    }

    var parameters = self._parseEndpoint(endpoint, options);
    var progress = self.interaction.progress(util.format($('Updating endpoint "%s"'), endpointName));
    try {
      endpoint = self.trafficManagerManagementClient.endpoints.createOrUpdate(resourceGroupName, profileName, options.type, endpointName, parameters, _);
    } finally {
      progress.end();
    }

    self._showEndpoint(profileName, endpointName, endpoint);
  },

  showEndpoint: function (resourceGroupName, profileName, endpointName, options, _) {
    var self = this;
    utils.verifyParamExistsInCollection(constants.trafficManager.endpointType, options.type, '--type');

    var endpoint = self.getEndpoint(resourceGroupName, profileName, endpointName, options.type, _);
    self._showEndpoint(profileName, endpointName, endpoint);
  },

  getEndpoint: function (resourceGroupName, profileName, endpointName, endpointType, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up the endpoint with name "%s" in Traffic Manager profile "%s"'),
      endpointName, profileName));
    try {
      var endpoint = self.trafficManagerManagementClient.endpoints.get(resourceGroupName, profileName, endpointType, endpointName, _);
      return endpoint;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  deleteEndpoint: function (resourceGroupName, profileName, endpointName, options, _) {
    var self = this;
    utils.verifyParamExistsInCollection(constants.trafficManager.endpointType, options.type, '--type');

    var endpoint = self.getEndpoint(resourceGroupName, profileName, endpointName, options.type, _);
    if (!endpoint) {
      throw new Error(util.format('An endpoint with name "%s" not found in Traffic Manager profile "%s"', endpointName, profileName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete endpoint "%s" ? [y/n] '), endpointName), _)) {
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting endpoint "%s"'), endpointName));
    try {
      self.trafficManagerManagementClient.endpoints.deleteMethod(resourceGroupName, profileName, options.type, endpointName, null, _);
    } finally {
      progress.end();
    }
  },

  /**
   * Interntal methods
   */
  _parseProfile: function (profile, options, useDefaults) {
    var self = this;

    if (options.profileStatus) {
      profile.profileStatus = utils.verifyParamExistsInCollection(constants.trafficManager.status,
        options.profileStatus, '--profile-status');
    }

    if (options.trafficRoutingMethod) {
      profile.trafficRoutingMethod = utils.verifyParamExistsInCollection(constants.trafficManager.routingMethod,
        options.trafficRoutingMethod, '--traffic-routing-method');
    } else if (useDefaults) {
      var defRoutingMethod = constants.trafficManager.routingMethod[0];
      self.output.warn(util.format($('Using default routing method: %s'), defRoutingMethod));
      profile.trafficRoutingMethod = defRoutingMethod;
    }

    if (options.ttl) {
      var ttl = parseInt(options.ttl);
      if (!ttl || ttl < 0) {
        throw new Error('time to live parameter must be a positive integer value');
      }
      profile.dnsConfig.ttl = ttl;
    } else if (useDefaults) {
      var defTtl = constants.trafficManager.defTtl;
      self.output.warn(util.format($('Using default ttl: %s'), defTtl));
      profile.dnsConfig.ttl = defTtl;
    }

    if (options.monitorProtocol) {
      profile.monitorConfig.protocol = utils.verifyParamExistsInCollection(constants.trafficManager.protocols,
        options.monitorProtocol, '--monitor-protocol');
    } else if (useDefaults) {
      var defProtocol = constants.trafficManager.protocols[0];
      self.output.warn(util.format($('Using default monitor protocol: %s'), defProtocol));
      profile.monitorConfig.protocol = defProtocol;
    }

    if (options.monitorPort) {
      var monitorPort = parseInt(options.monitorPort);
      if (!monitorPort || monitorPort < 0) {
        throw new Error('monitor port parameter must be a positive integer value');
      }
      profile.monitorConfig.port = monitorPort;
    } else if (useDefaults) {
      var defPort;
      if (profile.monitorConfig.protocol === 'http') {
        defPort = constants.trafficManager.unsecurePort;
      }
      if (profile.monitorConfig.protocol === 'https') {
        defPort = constants.trafficManager.securePort;
      }
      self.output.warn(util.format($('Using default monitor port: %s'), defPort));
      profile.monitorConfig.port = defPort;
    }

    if (options.monitorPath) {
      if (!utils.stringStartsWith(options.monitorPath, '/', true)) {
        self.output.warn(util.format($('The monitoring path "%s" must start with a forward slash, slash added'),
          options.monitorPath));
        options.monitorPath = '/' + options.monitorPath;
      }
      profile.monitorConfig.path = options.monitorPath;
    } else if (useDefaults) {
      var defPath = constants.trafficManager.defMonitorPath;
      self.output.warn(util.format($('Using default monitor path: %s'), defPath));
      profile.monitorConfig.path = defPath;
    }

    if (options.tags) {
      if (utils.argHasValue(options.tags)) {
        tagUtils.appendTags(profile, options);
      } else {
        profile.tags = {};
      }
    }

    return profile;
  },

  _parseEndpoint: function (endpoint, options) {
    var self = this;
    var typePrefix = constants.trafficManager.typePrefix;

    if (options.type) {
      utils.verifyParamExistsInCollection(constants.trafficManager.endpointType, options.type, '--type');
      endpoint.type = typePrefix + options.type;
    }

    if (options.target && options.targetResourceId) {
      throw new Error($('--target and --target-resource-id parameters are mutually exclusive'));
    }

    if (options.target) {
      if (!utils.ignoreCaseEquals(endpoint.type, typePrefix + constants.trafficManager.externalType)) {
        throw new Error(util.format($('--target parameter is valid only for endpoint of type "%s"'), constants.trafficManager.externalType));
      }
      if (utils.stringEndsWith(options.target, '.', true)) {
        self.output.warn(util.format($('The domain name "%s" ends with a dot, dot removed'), options.target));
        options.target = utils.trimTrailingChar(options.target, '.');
      }
      endpoint.target = options.target;
    }

    if (options.targetResourceId) {
      if (!utils.ignoreCaseEquals(endpoint.type, typePrefix + constants.trafficManager.azureType) && !utils.ignoreCaseEquals(endpoint.type, typePrefix + constants.trafficManager.nestedType)) {
        throw new Error(util.format($('--target-resource-id parameter is valid only for endpoint of type "%s" or "%s"'), constants.trafficManager.azureType, constants.trafficManager.nestedType));
      }
      endpoint.targetResourceId = options.targetResourceId;
    }

    if (options.location) {
      endpoint.endpointLocation = options.location;
    }

    if (options.status) {
      endpoint.endpointStatus = utils.verifyParamExistsInCollection(constants.trafficManager.status, options.status, '--status');
    }

    if (options.weight) {
      var weight = utils.parseInt(options.weight);
      if (isNaN(weight) || weight < constants.trafficManager.weightMin || weight > constants.trafficManager.weightMax) {
        throw new Error(util.format($('--weight must be an integer between %s and %s'), constants.trafficManager.weightMin, constants.trafficManager.weightMax));
      }
      endpoint.weight = weight;
    }

    if (options.priority) {
      var priority = utils.parseInt(options.priority);
      if (isNaN(priority) || priority < constants.trafficManager.priorityMin || priority > constants.trafficManager.priorityMax) {
        throw new Error(util.format($('--priority must be an integer between %s and %s'), constants.trafficManager.priorityMin, constants.trafficManager.priorityMax));
      }
      endpoint.priority = priority;
    }

    if(options.geoMapping) {
      endpoint.geoMapping = options.geoMapping.split(',');
    }

    return endpoint;
  },

  _showProfile: function (resourceGroupName, profile, profileName) {
    var self = this;
    self.interaction.formatOutput(profile, function (profile) {
      if (profile === null) {
        self.output.warn(util.format($('A Traffic Manager profile with name "%s" not found in the resource group "%s"'),
          profileName, resourceGroupName));
      } else {
        self.output.nameValue($('Id'), profile.id);
        self.output.nameValue($('Name'), profile.name);
        self.output.nameValue($('Type'), profile.type);
        self.output.nameValue($('Status'), profile.profileStatus);
        self.output.nameValue($('Routing method'), profile.trafficRoutingMethod);
        self.output.nameValue($('Tags'), tagUtils.getTagsInfo(profile.tags));
        self.output.header($('DNS config'));
        self.output.nameValue($('Relative name'), profile.dnsConfig.relativeName, 2);
        self.output.nameValue($('FQDN'), profile.dnsConfig.fqdn, 2);
        self.output.nameValue($('TTL'), profile.dnsConfig.ttl, 2);
        self.output.header($('Monitor config'));
        self.output.nameValue($('Protocol'), profile.monitorConfig.protocol, 2);
        self.output.nameValue($('Port'), profile.monitorConfig.port, 2);
        self.output.nameValue($('Path'), profile.monitorConfig.path, 2);

        var endpoints = profile.endpoints;
        if (endpoints.length !== 0) {
          self.output.header($('Endpoints'));
          self.output.table(endpoints, function (row, ep) {
            row.cell($('Name'), ep.name);
            row.cell($('Target'), ep.target);
            row.cell($('Status'), ep.endpointStatus);
            row.cell($('Location'), ep.endpointLocation || '');
            row.cell($('Weight'), ep.weight);
            row.cell($('Priority'), ep.priority);
            row.cell($('Type'), ep.type.replace(constants.trafficManager.typePrefix, ''));
          });
        }
      }
    });
  },

  _showEndpoint: function (profileName, endpointName, endpoint) {
    var self = this;
    self.interaction.formatOutput(endpoint, function (endpoint) {
      if (endpoint === null) {
        self.output.warn(util.format($('An endpoint with name "%s" not found in Traffic Manager profile "%s"'), endpointName, profileName));
      } else {
        self.output.nameValue($('Id'), endpoint.id);
        self.output.nameValue($('Name'), endpoint.name);
        self.output.nameValue($('Type'), endpoint.type);
        self.output.nameValue($('Location'), endpoint.endpointLocation);
        self.output.nameValue($('Status'), endpoint.endpointStatus);
        self.output.nameValue($('Target'), endpoint.target);
        self.output.nameValue($('Target resource id'), endpoint.targetResourceId);
        self.output.nameValue($('Weight'), endpoint.weight);
        self.output.nameValue($('Priority'), endpoint.priority);
        self.output.nameValue($('Geo Mapping'), endpoint.geoMapping);
      }
    });
  }
});

module.exports = TrafficManager;