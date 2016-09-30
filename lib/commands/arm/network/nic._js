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
var validation = require('../../../util/validation');
var $ = utils.getLocaleString;
var constants = require('./constants');
var tagUtils = require('../tag/tagUtils');
var resourceUtils = require('../resource/resourceUtils');
var Subnet = require('./subnet');
var LoadBalancer = require('./loadBalancer');
var Nsg = require('./nsg');
var PublicIp = require('./publicIp');

function Nic(cli, networkManagementClient) {
  this.networkManagementClient = networkManagementClient;
  this.subnetCrud = new Subnet(cli, networkManagementClient);
  this.loadBalancerCrud = new LoadBalancer(cli, networkManagementClient);
  this.nsgCrud = new Nsg(cli, networkManagementClient);
  this.publicIpCrud = new PublicIp(cli, networkManagementClient);
  this.output = cli.output;
  this.interaction = cli.interaction;
}

__.extend(Nic.prototype, {

  /**
   * NIC methods
   */
  create: function (resourceGroupName, nicName, options, _) {
    var self = this;

    if (!options.subnetId && !options.subnetName && !options.subnetVnetName) {
      throw new Error($('--subnet-id or --subnet-name, --subnet-vnet-name parameters must be provided'));
    }

    var nic = self.get(resourceGroupName, nicName, _);
    if (nic) {
      throw new Error(util.format($('A network interface with name "%s" already exists in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig = {
      name: constants.nic.defaultConfigName
    };

    nic = {
      location: options.location,
      ipConfigurations: []
    };

    nic = self._parseNic(resourceGroupName, nic, options, _);
    ipConfig = self._parseIpConfig(resourceGroupName, ipConfig, options, _);
    nic.ipConfigurations.push(ipConfig);

    var progress = self.interaction.progress(util.format($('Creating network interface "%s"'), nicName));
    try {
      nic = self.networkManagementClient.networkInterfaces.createOrUpdate(resourceGroupName, nicName, nic, _);
    } finally {
      progress.end();
    }

    self._showNic(nic, resourceGroupName, nicName);
  },

  set: function (resourceGroupName, nicName, options, _) {
    var self = this;
    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    nic = self._parseNic(resourceGroupName, nic, options, _);
    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic, resourceGroupName, nicName);
  },

  list: function (options, _) {
    var self = this;

    var nics = null;
    var progress = self.interaction.progress($('Getting the network interfaces'));

    try {
      if (options.resourceGroup) {
        if (options.virtualMachineScaleSetName) {
          if (options.virtualMachineIndex) {
            nics = self.networkManagementClient.networkInterfaces.listVirtualMachineScaleSetVMNetworkInterfaces(options.resourceGroup, options.virtualMachineScaleSetName, options.virtualMachineIndex, _);
          } else {
            nics = self.networkManagementClient.networkInterfaces.listVirtualMachineScaleSetNetworkInterfaces(options.resourceGroup, options.virtualMachineScaleSetName, _);
          }
        } else {
          nics = self.networkManagementClient.networkInterfaces.list(options.resourceGroup, _);
        }
      } else {
        nics = self.networkManagementClient.networkInterfaces.listAll(_);
      }
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(nics, function (nics) {
      if (nics.length === 0) {
        self.output.warn($('No network interfaces found'));
      } else {
        self.output.table(nics, function (row, nic) {
          row.cell($('Name'), nic.name);
          row.cell($('Location'), nic.location || '');
          var resInfo = resourceUtils.getResourceInformation(nic.id);
          row.cell($('Resource group'), resInfo.resourceGroup);
          row.cell($('Provisioning state'), nic.provisioningState);
          row.cell($('MAC Address'), nic.macAddress || '');
          row.cell($('IP forwarding'), nic.enableIPForwarding);
          row.cell($('Internal DNS name'), nic.dnsSettings.internalDnsNameLabel || '');
          row.cell($('Internal FQDN'), nic.dnsSettings.internalFqdn || '');
          if (nic.dnsSettings.internalDomainNameSuffix) {
            row.cell($('Internal domain name suffix'), nic.dnsSettings.internalDomainNameSuffix || '');
          }

        });
      }
    });
  },

  show: function (resourceGroupName, nicName, options, _) {
    var self = this;
    var nic = null;

    if (options.virtualMachineScaleSetName || options.virtualMachineIndex) {
      if (!(options.virtualMachineScaleSetName && options.virtualMachineIndex)) {
        throw new Error(util.format($('--virtual-machine-scale-set-name and --virtual-machine-index must be specified')));
      }
      nic = self.getFromScaleSet(resourceGroupName, options.virtualMachineScaleSetName, options.virtualMachineIndex, nicName, _);
    } else {
      nic = self.get(resourceGroupName, nicName, _);
    }

    self._showNic(nic, resourceGroupName, nicName);
  },

  get: function (resourceGroupName, nicName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up the network interface "%s"'), nicName));
    try {
      var nic = self.networkManagementClient.networkInterfaces.get(resourceGroupName, nicName, null, _);
      return nic;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  getEffectiveRouteTable: function (resourceGroupName, nicName, options, _) {
    var self = this;
    var result, progress;
    try {
      progress = self.interaction.progress($('Getting the effective route table'));
      result = self.networkManagementClient.networkInterfaces.getEffectiveRouteTable(resourceGroupName, nicName,  _);
    } finally {
      progress.end();
    }

    if (result.value.length === 0) {
      self.output.warn($('No effective route table found'));
    } else {
      self.output.table(result.value, function (row, item) {
        row.cell($('Source'), item.source);
        row.cell($('State'), item.state);
        row.cell($('Address Prefix'), item.addressPrefix);
        row.cell($('Next Hop Type'), item.nextHopType);
        row.cell($('Next Hop IP'), item.nextHopIpAddress);
      });
    }
  },

  listEffectiveNSG: function (resourceGroupName, nicName, options, _) {
    var self = this;
    var result, progress;
    try {
      progress = self.interaction.progress($('Getting the effective network security groups'));
      result = self.networkManagementClient.networkInterfaces.listEffectiveNetworkSecurityGroups(resourceGroupName, nicName,  _);
    } finally {
      progress.end();
    }

    if (result.value.length === 0) {
      self.output.warn($('No effective network security groups found'));
    } else {
      var tableOutput = [];
      result.value.forEach(function(item) {
        tableOutput.push({
          nic: item.networkSecurityGroup.id.substring(item.networkSecurityGroup.id.lastIndexOf('/') + 1),
          nsg: item.association.networkInterface.id.substring(item.association.networkInterface.id.lastIndexOf('/') + 1),
          rule: item.effectiveSecurityRules[0].name,
          access: item.effectiveSecurityRules[0].access,
          direction: item.effectiveSecurityRules[0].direction,
          protocol: item.effectiveSecurityRules[0].protocol
        });
        item.effectiveSecurityRules.forEach(function(rule, index) {
          if(index !== 0) {
            tableOutput.push({
              nic: '',
              nsg: '',
              rule: rule.name,
              access: rule.access,
              direction: rule.direction,
              protocol: rule.protocol,
            });
          }
        });
      });
      self.output.table(tableOutput, function (row, item) {
        row.cell($('NIC Name'), item.nic);
        row.cell($('NSG Name'), item.nsg);
        row.cell($('Rule Name'), item.rule);
        row.cell($('Protocol'), item.protocol);
        row.cell($('Direction'), item.direction);
        row.cell($('Access'), item.access);
      });
    }
  },

  getFromScaleSet: function (resourceGroupName, virtualMachineScaleSetName, virtualMachineIndex, nicName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up the network interface "%s" in scale set "%s"'), nicName, virtualMachineScaleSetName));
    try {
      var nic = self.networkManagementClient.networkInterfaces.getVirtualMachineScaleSetNetworkInterface(resourceGroupName, virtualMachineScaleSetName, virtualMachineIndex, nicName, null, _);
      return nic;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  delete: function (resourceGroupName, nicName, options, _) {
    var self = this;
    var nic = self.get(resourceGroupName, nicName, _);

    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete network interface "%s"? [y/n] '), nicName), _)) {
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting network interface "%s"'), nicName));
    try {
      self.networkManagementClient.networkInterfaces.deleteMethod(resourceGroupName, nicName, _);
    } finally {
      progress.end();
    }
  },

  update: function (resourceGroupName, nicName, nic, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Updating network interface "%s"'), nicName));
    try {
      nic = self.networkManagementClient.networkInterfaces.createOrUpdate(resourceGroupName, nicName, nic, _);
      return nic;
    } finally {
      progress.end();
    }
  },

  /**
   * NIC IP Configuration methods
   */
  createIpConfig: function (resourceGroupName, nicName, ipConfigName, options, _) {
    var self = this;
    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig = {
      name: ipConfigName
    };

    if (utils.findFirstCaseIgnore(nic.ipConfigurations, {name: ipConfigName})) {
      throw new Error(util.format($('IP configuration with name "%s" already exists in the nic "%s"'), ipConfigName, nicName));
    }

    if (options.isPrimary && !options.quiet && !self.interaction.confirm(util.format($('There is a primary IP configurator already. ' +
        'Do you want to make new config primary? [y/n] ')), _)) {
      return;
    }

    self._changePrimaryConfig(nic, ipConfig, options.isPrimary);
    ipConfig = self._parseIpConfig(resourceGroupName, ipConfig, options, _, nic);

    nic.ipConfigurations.push(ipConfig);
    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic);
  },

  setIpConfig: function (resourceGroupName, nicName, ipConfigName, options, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig = utils.findFirstCaseIgnore(nic.ipConfigurations, {name: ipConfigName});
    if (!ipConfig) {
      throw new Error(util.format($('IP configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
    }

    if(options.isPrimary) {
      self._changePrimaryConfig(nic, ipConfig, options.isPrimary);
    }

    self._parseIpConfig(resourceGroupName, ipConfig, options, _, nic);
    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic);
  },

  listIpConfigs: function (resourceGroupName, nicName, options, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    self.interaction.formatOutput(nic.ipConfigurations, function (ipConfigurations) {
      if (ipConfigurations.length === 0) {
        self.output.warn($('No ip configurations found'));
      } else {
        self.output.table(ipConfigurations, function (row, ipConfig) {
          row.cell($('Name'), ipConfig.name);
          row.cell($('Provisioning state'), ipConfig.provisioningState);
          row.cell($('Primary'), ipConfig.primary);
          row.cell($('Private IP allocation'), ipConfig.privateIPAllocationMethod);
          row.cell($('Private IP version'), ipConfig.privateIPAddressVersion);
          row.cell($('Private IP address'), ipConfig.privateIPAddress || '');

          var subnetName = '';
          if (ipConfig.subnet) {
            subnetName = resourceUtils.getResourceInformation(ipConfig.subnet.id).resourceName;
          }
          row.cell($('Subnet'), subnetName);

          var publicIpName = '';
          if (ipConfig.publicIPAddress) {
            publicIpName = resourceUtils.getResourceInformation(ipConfig.publicIPAddress.id).resourceName;
          }
          row.cell($('Public IP'), publicIpName);
        });
      }
    });
  },

  showIpConfig: function (resourceGroupName, nicName, ipConfigName, options, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig = utils.findFirstCaseIgnore(nic.ipConfigurations, {name: ipConfigName});
    self._showIpConfig(ipConfig, nicName, ipConfigName);
  },

  deleteIpConfig: function (resourceGroupName, nicName, ipConfigName, options, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var index = utils.indexOfCaseIgnore(nic.ipConfigurations, {name: ipConfigName});
    if (index === -1) {
      throw new Error(util.format($('IP configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete ip configuration "%s" ? [y/n] '), ipConfigName), _)) {
      return;
    }

    nic.ipConfigurations.splice(index, 1);

    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic);
  },

  /**
   * NIC Backend Address Pool methods
   */
  createBackendAddressPool: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateBackendAddressPool(resourceGroupName, nicName, ipConfigName, options, true, _);
  },

  deleteBackendAddressPool: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateBackendAddressPool(resourceGroupName, nicName, ipConfigName, options, false, _);
  },

  /**
   * NIC Inbound NAT Rule methods
   */
  createInboundNatRule: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateInboundNatRule(resourceGroupName, nicName, ipConfigName, options, true, _);
  },

  deleteInboundNatRule: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateInboundNatRule(resourceGroupName, nicName, ipConfigName, options, false, _);
  },

  /**
   * Internal methods
   */
  _changePrimaryConfig: function (nic, ipConfig, isPrimary) {
    if(!isPrimary) {
      return;
    }
    isPrimary = utils.parseBool(isPrimary, '--is-primary');
    if(isPrimary === true)
      for(var i in nic.ipConfigurations) {
        nic.ipConfigurations[i].primary = false;
      }
    ipConfig.primary = isPrimary;
  },

  _parseNic: function (resourceGroupName, nic, options, _) {
    var self = this;

    if (options.networkSecurityGroupId) {
      if (options.networkSecurityGroupName) self.output.warn($('--network-security-group-name parameter will be ignored because --network-security-group-id and --network-security-group-name are mutually exclusive'));
      if (utils.argHasValue(options.networkSecurityGroupId)) {
        nic.networkSecurityGroup = {
          id: options.networkSecurityGroupId
        };
      } else {
        delete nic.networkSecurityGroup;
      }
    } else if (options.networkSecurityGroupName) {
      if (utils.argHasValue(options.networkSecurityGroupName)) {
        var nsg = self.nsgCrud.get(resourceGroupName, options.networkSecurityGroupName, _);
        if (!nsg) {
          throw new Error(util.format($('A network security group with name "%s" not found in the resource group "%s"'), options.networkSecurityGroupName, resourceGroupName));
        }
        nic.networkSecurityGroup = {
          id: nsg.id
        };
      } else {
        delete nic.networkSecurityGroup;
      }
    }

    if (options.internalDnsNameLabel) {
      if (utils.argHasValue(options.internalDnsNameLabel)) {
        if (!nic.dnsSettings) nic.dnsSettings = {};
        nic.dnsSettings.internalDnsNameLabel = options.internalDnsNameLabel;
      } else {
        delete nic.dnsSettings;
      }
    }

    if (options.enableIpForwarding) {
      nic.enableIPForwarding = utils.parseBool(options.enableIpForwarding, '--enable-ip-forwarding');
    }

    if (options.tags) {
      if (utils.argHasValue(options.tags)) {
        tagUtils.appendTags(nic, options);
      } else {
        nic.tags = {};
      }
    }

    return nic;
  },

  _parseIpConfig: function(resourceGroupName, ipConfig, options, _, nic) {
    var self = this;
    if (options.privateIpVersion) {
      ipConfig.privateIPAddressVersion = validation.isIn(options.privateIpVersion, constants.publicIp.version, '--private-ip-version');
    } else {
      options.privateIpVersion = constants.publicIp.version[0];
    }
    if(nic && options.privateIpVersion && options.privateIpVersion.toLowerCase() === constants.publicIp.version[0].toLowerCase() && !options.subnetId && !options.subnetName) {
      var primaryIpConfig = utils.findFirstCaseIgnore(nic.ipConfigurations, {primary: true});
      options.subnetId = primaryIpConfig.subnet.id;
    }

    if (options.privateIpAddress) {
      ipConfig.privateIPAddress = validation.isIP(options.privateIpAddress, '--private-ip-address');
      ipConfig.privateIPAllocationMethod = 'Static';
    }

    if (options.subnetId) {
      if (options.subnetName || options.subnetVnetName) {
        self.output.warn($('--subnet-name, --subnet-vnet-name parameters will be ignored because --subnet-name, --subnet-vnet-name and --subnet-id are mutually exclusive'));
      }
      ipConfig.subnet = {
        id: options.subnetId
      };
    } else if (options.subnetName && options.subnetVnetName) {
      var subnet = self.subnetCrud.get(resourceGroupName, options.subnetVnetName, options.subnetName, _);
      if (!subnet) {
        throw new Error(util.format($('A subnet with name "%s" not found in the resource group "%s"'), options.subnetName, resourceGroupName));
      }
      ipConfig.subnet = {
        id: subnet.id
      };
    }

    if (options.publicIpId) {
      if (options.publicIpName) self.output.warn($('--public-ip-name parameter will be ignored because --public-ip-id and --public-ip-name are mutually exclusive'));
      if (utils.argHasValue(options.publicIpId)) {
        ipConfig.publicIPAddress = {
          id: options.publicIpId
        };
      } else {
        delete ipConfig.publicIPAddress;
      }
    } else if (options.publicIpName) {
      if (utils.argHasValue(options.publicIpName)) {
        var publicIp = self.publicIpCrud.get(resourceGroupName, options.publicIpName, _);
        if (!publicIp) {
          throw new Error(util.format($('A public ip address with name "%s" not found in the resource group "%s"'), options.publicIpName, resourceGroupName));
        }
        ipConfig.publicIPAddress = {
          id: publicIp.id
        };
      } else {
        delete ipConfig.publicIPAddress;
      }
    } else if(options.publicIpId === '' || options.publicIpName === '') {
      ipConfig.publicIPAddress = {};
    }

    if (options.lbAddressPoolIds) {
      if (utils.argHasValue(options.lbAddressPoolIds)) {
        ipConfig.loadBalancerBackendAddressPools = [];
        var poolIds = options.lbAddressPoolIds.split(',');
        poolIds.forEach(function (poolId) {
          poolId = poolId.replace(/'|''$/gm, ''); // removing quotes
          var pool = {
            id: poolId
          };
          ipConfig.loadBalancerBackendAddressPools.push(pool);
        });
      } else {
        ipConfig.loadBalancerBackendAddressPools = [];
      }
    }

    if (options.lbInboundNatRuleIds) {
      if (utils.argHasValue(options.lbInboundNatRuleIds)) {
        ipConfig.loadBalancerInboundNatRules = [];
        var natIds = options.lbInboundNatRuleIds.split(',');
        natIds.forEach(function (natId) {
          natId = natId.replace(/'|''$/gm, ''); // removing quotes
          var nat = {
            id: natId
          };
          ipConfig.loadBalancerInboundNatRules.push(nat);
        });
      } else {
        ipConfig.loadBalancerInboundNatRules = [];
      }
    }

    return ipConfig;
  },

  _showNic: function (nic, resourceGroupName, nicName) {
    var self = this;

    self.interaction.formatOutput(nic, function (nic) {
      if (nic === null) {
        self.output.warn(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
        return;
      }

      self.output.nameValue($('Id'), nic.id);
      self.output.nameValue($('Name'), nic.name);
      self.output.nameValue($('Type'), nic.type);
      self.output.nameValue($('Location'), nic.location);
      self.output.nameValue($('Provisioning state'), nic.provisioningState);
      self.output.nameValue($('Tags'), tagUtils.getTagsInfo(nic.tags));
      self.output.nameValue($('MAC address'), nic.macAddress);
      self.output.nameValue($('Internal DNS name label'), nic.dnsSettings.internalDnsNameLabel);
      self.output.nameValue($('Internal FQDN'), nic.dnsSettings.internalFqdn);
      self.output.nameValue($('Internal domain name suffix'), nic.dnsSettings.internalDomainNameSuffix);
      self.output.nameValue($('Enable IP forwarding'), nic.enableIPForwarding);

      if (nic.networkSecurityGroup) {
        self.output.nameValue($('Network security group'), nic.networkSecurityGroup.id);
      }
      if (nic.virtualMachine) {
        self.output.nameValue($('Virtual machine'), nic.virtualMachine.id);
      }

      self.output.header($('IP configurations'));
      nic.ipConfigurations.forEach(function (ipConfig) {
        self._showIpConfig(ipConfig, nicName, ipConfig.name);
        self.output.data($(''), '');
      });
    });
  },

  _showIpConfig: function(ipConfig, nicName, ipConfigName) {
    var self = this;
    var configIndent = 2;
    var subItemsIndent = 4;

    self.interaction.formatOutput(ipConfig, function (ipConfig) {
      if (ipConfig === null || ipConfig === undefined) {
        self.output.warn(util.format($('IP configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
        return;
      }

      self.output.nameValue($('Name'), ipConfig.name, configIndent);
      self.output.nameValue($('Primary'), ipConfig.primary, configIndent);
      self.output.nameValue($('Provisioning state'), ipConfig.provisioningState, configIndent);
      self.output.nameValue($('Private IP address'), ipConfig.privateIPAddress, configIndent);
      self.output.nameValue($('Private IP version'), ipConfig.privateIPAddressVersion, configIndent);
      self.output.nameValue($('Private IP allocation method'), ipConfig.privateIPAllocationMethod, configIndent);
      if (ipConfig.publicIPAddress) {
        self.output.nameValue($('Public IP address'), ipConfig.publicIPAddress.id, configIndent);
      }
      if (ipConfig.subnet) {
        self.output.nameValue($('Subnet'), ipConfig.subnet.id, configIndent);
      }

      if (ipConfig.loadBalancerBackendAddressPools && ipConfig.loadBalancerBackendAddressPools.length > 0) {
        self.output.header($('Load balancer backend address pools'), configIndent);
        ipConfig.loadBalancerBackendAddressPools.forEach(function (pool) {
          self.output.nameValue($('Id'), pool.id, subItemsIndent);
        });
      }
      if (ipConfig.loadBalancerInboundNatRules && ipConfig.loadBalancerInboundNatRules.length > 0) {
        self.output.header($('Load balancer inbound NAT rules'), configIndent);
        ipConfig.loadBalancerInboundNatRules.forEach(function (rule) {
          self.output.nameValue($('Id'), rule.id, subItemsIndent);
        });
      }
    });
  },

  _updateBackendAddressPool: function (resourceGroupName, nicName, ipConfigName, options, isAdding, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig;
    if (ipConfigName) {
      ipConfig = utils.findFirstCaseIgnore(nic.ipConfigurations, {name: ipConfigName});
      if (!ipConfig) {
        throw new Error(util.format($('An ip configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
      }
    } else {
      ipConfig = nic.ipConfigurations[0];
      self.output.warn(util.format($('--ip-config-name not specified, using "%s" ip configuration'), ipConfig.name));
    }


    var poolId = null;
    if (!ipConfig.loadBalancerBackendAddressPools) {
      ipConfig.loadBalancerBackendAddressPools = [];
    }

    if (!options.lbAddressPoolId && !options.lbName && !options.lbAddressPoolName) {
      throw new Error($('You must specify --lb-address-pool-id or --lb-name, --lb-address-pool-name'));
    }

    if (options.lbAddressPoolId) {
      if (options.lbName || options.lbAddressPoolName) {
        self.output.warn('--lb-name parameter, --lb-address-pool-name will be ignored');
      }
      poolId = options.lbAddressPoolId;
    } else if (options.lbName || options.lbAddressPoolName) {
      if (!options.lbName) {
        throw new Error($('You must specify --lb-name parameter if --lb-address-pool-name is specified'));
      }
      if (!options.lbAddressPoolName) {
        throw new Error($('You must specify --lb-address-pool-name parameter if --lb-name is specified'));
      }

      var lb = self.loadBalancerCrud.get(resourceGroupName, options.lbName, _);
      if (!lb) {
        throw new Error(util.format($('A load balancer with name "%s" not found in the resource group "%s'), options.lbName, resourceGroupName));
      }

      var pool = utils.findFirstCaseIgnore(lb.backendAddressPools, {name: options.lbAddressPoolName});
      if (!pool) {
        throw new Error(util.format($('A backend address pool with name "%s" not found in the load balancer "%s" resource group "%s"'), options.lbAddressPoolName, options.lbName, resourceGroupName));
      }
      poolId = pool.id;
    }

    if (isAdding) {
      if (utils.findFirstCaseIgnore(ipConfig.loadBalancerBackendAddressPools, {id: poolId})) {
        throw new Error(util.format($('Specified backend address pool already attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
      ipConfig.loadBalancerBackendAddressPools.push({id: poolId});
    } else {
      var index = utils.indexOfCaseIgnore(ipConfig.loadBalancerBackendAddressPools, {id: poolId});
      if (index === -1) {
        throw new Error(util.format($('Backend address pool is not attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
      ipConfig.loadBalancerBackendAddressPools.splice(index, 1);
    }

    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic);
  },

  _updateInboundNatRule: function (resourceGroupName, nicName, ipConfigName, options, isAdding, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig;
    if (ipConfigName) {
      ipConfig = utils.findFirstCaseIgnore(nic.ipConfigurations, {name: ipConfigName});
      if (!ipConfig) {
        throw new Error(util.format($('An ip configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
      }
    } else {
      ipConfig = nic.ipConfigurations[0];
      self.output.warn(util.format($('--ip-config-name not specified, using "%s" ip configuration'), ipConfig.name));
    }


    var ruleId = null;
    if (!ipConfig.loadBalancerInboundNatRules) {
      ipConfig.loadBalancerInboundNatRules = [];
    }

    if (!options.lbInboundNatRuleId && !options.lbName && !options.lbInboundNatRuleName) {
      throw new Error($('You must specify --lb-inbound-nat-rule-id or --lb-name, --lb-inbound-nat-rule-name'));
    }

    if (options.lbInboundNatRuleId) {
      if (options.lbName || options.lbInboundNatRuleName) {
        self.output.warn('--lb-name, --lb-inbound-nat-rule-name will be ignored');
      }
      ruleId = options.lbInboundNatRuleId;
    } else if (options.lbName || options.lbInboundNatRuleName) {
      if (!options.lbName) {
        throw new Error($('You must specify --lb-name parameter if --lb-inbound-nat-rule-name is specified'));
      }
      if (!options.lbInboundNatRuleName) {
        throw new Error($('You must specify --lb-inbound-nat-rule-name parameter if --lb-name is specified'));
      }

      var lb = self.loadBalancerCrud.get(resourceGroupName, options.lbName, _);
      if (!lb) {
        throw new Error(util.format($('A load balancer with name "%s" not found in the resource group "%s'), options.lbName, resourceGroupName));
      }

      var rule = utils.findFirstCaseIgnore(lb.inboundNatRules, {name: options.lbInboundNatRuleName});
      if (!rule) {
        throw new Error(util.format($('An inbound NAT rule with name "%s" not found in the load balancer "%s"'), options.lbInboundNatRuleName, options.lbName));
      } else {
        ruleId = rule.id;
      }
    }

    if (isAdding) {
      if (!utils.findFirstCaseIgnore(ipConfig.loadBalancerInboundNatRules, {id: ruleId})) {
        ipConfig.loadBalancerInboundNatRules.push({id: ruleId});
      } else {
        throw new Error(util.format($('Inbound NAT rule already attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
    } else {
      var index = utils.indexOfCaseIgnore(ipConfig.loadBalancerInboundNatRules, {id: ruleId});
      if (index !== -1) {
        ipConfig.loadBalancerInboundNatRules.splice(index, 1);
      } else {
        throw new Error(util.format($('Inbound NAT rule is not attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
    }

    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic);
  }
});

module.exports = Nic;