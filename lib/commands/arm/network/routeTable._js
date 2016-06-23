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
var constants = require('./constants');
var validation = require('../../../util/validation');
var $ = utils.getLocaleString;
var tagUtils = require('../tag/tagUtils');
var resourceUtils = require('../resource/resourceUtils');

function RouteTable(cli, networkManagementClient) {
  this.networkManagementClient = networkManagementClient;
  this.output = cli.output;
  this.interaction = cli.interaction;
}

__.extend(RouteTable.prototype, {
  /**
   * Route Table methods
   */
  create: function (resourceGroupName, routeTableName, options, _) {
    var self = this;

    var parameters = {
      location: options.location
    };

    parameters = self._parseRouteTable(parameters, options);

    var routeTable = self.get(resourceGroupName, routeTableName, _);
    if (routeTable) {
      throw new Error(util.format($('A Route Table with name "%s" already exists in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    var progress = self.interaction.progress(util.format($('Creating Route Table "%s"'), routeTableName));
    try {
      routeTable = self.networkManagementClient.routeTables.createOrUpdate(resourceGroupName, routeTableName, parameters, _);
    } finally {
      progress.end();
    }
    self._showRouteTable(routeTable, resourceGroupName, routeTableName);
  },

  set: function (resourceGroupName, routeTableName, options, _) {
    var self = this;

    var routeTable = self.get(resourceGroupName, routeTableName, _);
    if (!routeTable) {
      throw new Error(util.format($('A Route Table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    routeTable = self._parseRouteTable(routeTable, options);

    var progress = self.interaction.progress(util.format($('Updating Route Table "%s"'), routeTableName));
    try {
      routeTable = self.networkManagementClient.routeTables.createOrUpdate(resourceGroupName, routeTableName, routeTable, _);
    } finally {
      progress.end();
    }
    self._showRouteTable(routeTable, resourceGroupName, routeTableName);
  },

  show: function (resourceGroupName, routeTableName, options, _) {
    var self = this;
    var routeTable = self.get(resourceGroupName, routeTableName, _);

    self.interaction.formatOutput(routeTable, function (routeTable) {
      if (!routeTable) {
        self.output.warn(util.format($('A route table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
      } else {
        self._showRouteTable(routeTable, resourceGroupName, routeTableName);
      }
    });
  },

  list: function (options, _) {
    var self = this;

    var progress = self.interaction.progress(('Looking up Route Tables'));
    var routeTables;

    try {
      if (options.resourceGroup) {
        routeTables = self.networkManagementClient.routeTables.list(options.resourceGroup, _);
      } else {
        routeTables = self.networkManagementClient.routeTables.listAll(_);
      }
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(routeTables, function (routeTables) {
      if (routeTables.length === 0) {
        self.output.warn($('No route tables found'));
      } else {
        self.output.table(routeTables, function (row, routeTable) {
          row.cell($('Name'), routeTable.name);
          row.cell($('Location'), routeTable.location);
          var resInfo = resourceUtils.getResourceInformation(routeTable.id);
          row.cell($('Resource group'), resInfo.resourceGroup);
          row.cell($('Routes number'), routeTable.routes.length);
          row.cell($('Subnets number'), routeTable.subnets ? routeTable.subnets.length : '0');
        });
      }
    });
  },

  delete: function (resourceGroupName, routeTableName, options, _) {
    var self = this;
    var routeTable = self.get(resourceGroupName, routeTableName, _);

    if (!routeTable) {
      throw new Error(util.format($('Route table "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete route table "%s"? [y/n] '), routeTableName), _)) {
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting route table "%s"'), routeTableName));
    try {
      self.networkManagementClient.routeTables.deleteMethod(resourceGroupName, routeTableName, _);
    } finally {
      progress.end();
    }
  },

  get: function (resourceGroupName, routeTableName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up Route Table "%s"'), routeTableName));
    try {
      var routeTable = self.networkManagementClient.routeTables.get(resourceGroupName, routeTableName, null, _);
      return routeTable;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  /**
   * Route methods
   */
  createRoute: function (resourceGroupName, routeTableName, routeName, options, _) {
    var self = this;

    var parameters = {};
    parameters = self._parseRoute(parameters, options);

    var routeTable = self.get(resourceGroupName, routeTableName, _);
    if (!routeTable) {
      throw new Error(util.format($('A Route Table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    var route = self.getRoute(resourceGroupName, routeTableName, routeName, _);
    if (route) {
      throw new Error(util.format($('A route with name "%s" already exists in a route table "%s"'), routeName, routeTableName));
    }

    var progress = self.interaction.progress(util.format($('Creating route "%s" in a route table "%s"'), routeName, routeTableName));
    try {
      route = self.networkManagementClient.routes.createOrUpdate(resourceGroupName, routeTableName, routeName, parameters, _);
    } finally {
      progress.end();
    }
    self._showRoute(route, routeTableName, routeName);
  },

  setRoute: function (resourceGroupName, routeTableName, routeName, options, _) {
    var self = this;

    var routeTable = self.get(resourceGroupName, routeTableName, _);
    if (!routeTable) {
      throw new Error(util.format($('A Route Table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    var route = self.getRoute(resourceGroupName, routeTableName, routeName, _);
    if (!route) {
      throw new Error(util.format($('A route with name "%s" not found in the Route Table "%s"'), routeName, routeTableName));
    }

    route = self._parseRoute(route, options);

    var progress = self.interaction.progress(util.format($('Updating route "%s" in a route table "%s"'), routeName, routeTableName));
    try {
      route = self.networkManagementClient.routes.createOrUpdate(resourceGroupName, routeTableName, routeName, route, _);
    } finally {
      progress.end();
    }
    self._showRoute(route, routeTableName, routeName);
  },

  listRoutes: function (resourceGroupName, routeTableName, options, _) {
    var self = this;

    var routeTable = self.get(resourceGroupName, routeTableName, _);
    if (!routeTable) {
      throw new Error(util.format($('A Route Table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    var progress = self.interaction.progress(util.format($('Looking up routes in a Route Table "%s"'), routeTableName));
    var routes;

    try {
      routes = self.networkManagementClient.routes.list(resourceGroupName, routeTableName, _);
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(routes, function (routes) {
      if (routes.length === 0) {
        self.output.warn(util.format($('No routes found in the Route Table "%s"'), routeTableName));
      } else {
        self.output.table(routes, function (row, route) {
          row.cell($('Name'), route.name);
          row.cell($('Address prefix'), route.addressPrefix);
          row.cell($('Next hop type'), route.nextHopType);
          row.cell($('Next hop IP address'), route.nextHopIpAddress || '');
        });
      }
    });
  },

  showRoute: function (resourceGroupName, routeTableName, routeName, options, _) {
    var self = this;

    var routeTable = self.get(resourceGroupName, routeTableName, _);
    if (!routeTable) {
      throw new Error(util.format($('A Route Table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    var route = self.getRoute(resourceGroupName, routeTableName, routeName, _);
    self._showRoute(route, routeTableName, routeName);
  },

  deleteRoute: function (resourceGroupName, routeTableName, routeName, options, _) {
    var self = this;

    var routeTable = self.get(resourceGroupName, routeTableName, _);
    if (!routeTable) {
      throw new Error(util.format($('A Route Table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
    }

    var route = self.getRoute(resourceGroupName, routeTableName, routeName, _);
    if (!route) {
      throw new Error(util.format($('A route with name "%s" not found'), routeName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete route "%s"? [y/n] '), routeName), _)) {
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting route "%s"'), routeName));
    try {
      self.networkManagementClient.routes.deleteMethod(resourceGroupName, routeTableName, routeName, _);
    } finally {
      progress.end();
    }
  },

  getRoute: function (resourceGroupName, routeTableName, routeName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up route "%s" in route table "%s"'), routeName, routeTableName));
    try {
      var route = self.networkManagementClient.routes.get(resourceGroupName, routeTableName, routeName, _);
      return route;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  /**
   * Private methods
   */
  _parseRouteTable: function (routeTable, options) {
    if (options.tags) {
      if (utils.argHasValue(options.tags)) {
        tagUtils.appendTags(routeTable, options);
      } else {
        routeTable.tags = {};
      }
    }

    return routeTable;
  },

  _parseRoute: function (route, options) {
    if (options.addressPrefix) {
      route.addressPrefix = validation.isCIDR(options.addressPrefix, '--address-prefix');
    }

    if (options.nextHopIpAddress) {
      route.nextHopIpAddress = validation.isIP(options.nextHopIpAddress, '--next-hop-ip-address');
    }

    if (options.nextHopType) {
      route.nextHopType = validation.isIn(options.nextHopType, constants.route.nextHopType, '--next-hop-type');
      if (!utils.ignoreCaseEquals(options.nextHopType, constants.route.nextHopType[0])) {
        delete route.nextHopIpAddress;
      }
    }

    return route;
  },

  _showRouteTable: function (routeTable, resourceGroupName, routeTableName) {
    var self = this;

    self.interaction.formatOutput(routeTable, function (routeTable) {
      if (!routeTable) {
        self.output.warn(util.format($('A route table with name "%s" not found in the resource group "%s"'), routeTableName, resourceGroupName));
        return;
      }

      self.output.nameValue($('Id'), routeTable.id);
      self.output.nameValue($('Name'), routeTable.name);
      self.output.nameValue($('Type'), routeTable.type);
      self.output.nameValue($('Location'), routeTable.location);
      self.output.nameValue($('Provisioning state'), routeTable.provisioningState);
      self.output.nameValue($('Tags'), tagUtils.getTagsInfo(routeTable.tags));

      if (routeTable.subnets && routeTable.subnets.length > 0) {
        self.output.header($('Subnets'));
        routeTable.subnets.forEach(function (subnet) {
          self.output.nameValue($('Id'), subnet.id, 2);
        });
      }
      if (routeTable.routes && routeTable.routes.length > 0) {
        self.output.header($('Routes'));
        routeTable.routes.forEach(function (route) {
          self.output.nameValue($('Name'), route.name, 2);
          self.output.nameValue($('Address prefix'), route.addressPrefix, 2);
          self.output.nameValue($('Next hop type'), route.nextHopType, 2);
          self.output.nameValue($('Next hop IP address'), route.nextHopIpAddress, 2);
          self.output.data('');
        });
      }
    });
  },

  _showRoute: function (route, routeTableName, routeName) {
    var self = this;

    self.interaction.formatOutput(route, function (route) {
      if (!route) {
        self.output.warn(util.format($('A route with name "%s" not found in table "%s"'), routeName, routeTableName));
        return;
      }

      self.output.nameValue($('Id'), route.id);
      self.output.nameValue($('Name'), route.name);
      self.output.nameValue($('Provisioning state'), route.provisioningState);
      self.output.nameValue($('Next hop type'), route.nextHopType);
      self.output.nameValue($('Next hop IP address'), route.nextHopIpAddress);
      self.output.nameValue($('Address prefix'), route.addressPrefix);
    });
  }
});

module.exports = RouteTable;