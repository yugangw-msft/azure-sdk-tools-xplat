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
var async = require('async');
var path = require('path');
var util = require('util');
var fs = require('fs');

var testUtils = require('../util/util');
var retry = 5;

//Moving to common util file
//var dockerCerts;
//var sshKeys;
var ImageUrnPath = './test/data/imageUrn.json';
var Imagejsontext = '{"ImageUrn":[' +
  '{"Windows":""},' +
  '{"Linux":""}]}';
exports = module.exports = VMTestUtil;

/**
 * @class
 * Initializes a new instance of the VMTestUtil class.
 * @constructor
 * 
 * Example use of this class:
 *
 * //creates mobile test class
 * var vmUtil = new VMTestUtil();
 * // use the methods 
 * 
 */
function VMTestUtil() {
  this.linuxSkus;
  this.linuxImageUrn;
  this.linuxPublisher = 'Canonical';
  this.linuxOffer = 'UbuntuServer';
  this.linuxDockerSkus = '14.04.1-LTS';
  this.vmSize;
  this.winPublisher = 'MicrosoftWindowsServer';
  this.winOffer = 'WindowsServer';
  this.winSkus;
  this.winImageUrn;
  this.timeoutLarge = 800000;
  this.timeoutMedium = 600000;
}

VMTestUtil.prototype.createGroup = function(groupName, location, suite, callback) {
  var timestamp = (new Date()).toISOString();
  var tagstr = (suite.testPrefix + '=' + timestamp);
  suite.execute('group create %s --location %s --tags %s --json', groupName, location, tagstr, function(result) {
    result.exitStatus.should.equal(0);
    callback();
  });
};

VMTestUtil.prototype.setGroup = function(groupName, suite, callback) {
  var timestamp = (new Date()).toISOString();
  var tagstr = (suite.testPrefix + '=' + timestamp);
  suite.execute('group set --name %s --tags %s --json', groupName, tagstr, function(result) {
    result.exitStatus.should.equal(0);
    callback();
  });
};

VMTestUtil.prototype.deleteUsedGroup = function(groupName, suite, callback) {
  if (!suite.isPlayback()) {
    suite.execute('group delete %s --quiet --json', groupName, function(result) {
      result.exitStatus.should.equal(0);
      callback();
    });
  } else callback();
};

VMTestUtil.prototype.CreateVmWithNic = function(group, name, location, os, urn, nic, user, password, storageAccount, suite, callback) {
  suite.execute('storage account create %s --resource-group %s --location %s --sku-name LRS --kind Storage --json',
    storageAccount, group, location, function(result) {
    result.exitStatus.should.equal(0);
    suite.execute('vm sizes -l %s --json', location, function(result) {
      result.exitStatus.should.equal(0);
      // Choosing available size
      var output = JSON.parse(result.text);
      var vmSize = output[0].name;
      suite.execute('vm create %s %s %s %s --image-urn %s --nic-names %s --admin-username %s --admin-password %s --storage-account-name %s -z %s --json',
        group, name, location, os, urn, nic, user, password, storageAccount, vmSize, function(result) {
        result.exitStatus.should.equal(0);
        callback();
      });
    });
  });
};

VMTestUtil.prototype.RemoveVm = function(group, name, suite, callback) {
  suite.execute('vm delete %s %s --quiet --json', group, name, function(result) {
    result.exitStatus.should.equal(0);
    callback();
  });
};

VMTestUtil.prototype.GetLinuxSkusList = function(location, suite, callback) {
  suite.execute('vm image list-skus %s %s %s --json', location, this.linuxPublisher, this.linuxOffer, function(result) {
    result.exitStatus.should.equal(0);
    var allResources = JSON.parse(result.text);
    VMTestUtil.linuxSkus = allResources[0].name;
    callback();
  });
};
VMTestUtil.prototype.GetLinuxImageList = function(location, suite, callback) {
  var UrnPath = './test/data/imageUrn.json';
  suite.execute('vm image list %s %s %s %s --json', location, this.linuxPublisher, this.linuxOffer, VMTestUtil.linuxSkus, function(result) {
    result.exitStatus.should.equal(0);
    var allResources = JSON.parse(result.text);
    VMTestUtil.linuxImageUrn = allResources[0].urn;

    var text = '{"ImageUrn":[' +
      '{"Windows": "' + VMTestUtil.winImageUrn + '"},' +
      '{"Linux":"' + VMTestUtil.linuxImageUrn + '"}]}';

    fs.writeFile(UrnPath, text, function(err) {});
    callback();
  });
};
VMTestUtil.prototype.GetWindowsSkusList = function(location, suite, callback) {
  suite.execute('vm image list-skus %s %s %s --json', location, this.winPublisher, this.winOffer, function(result) {
    result.exitStatus.should.equal(0);
    var allResources = JSON.parse(result.text);
    VMTestUtil.winSkus = allResources[1].name;
    callback();
  });
};
VMTestUtil.prototype.GetWindowsImageList = function(location, suite, callback) {
  var UrnPath = './test/data/imageUrn.json';
  suite.execute('vm image list %s %s %s %s --json', location, this.winPublisher, this.winOffer, VMTestUtil.winSkus, function(result) {
    result.exitStatus.should.equal(0);
    var allResources = JSON.parse(result.text);
    VMTestUtil.winImageUrn = allResources[0].urn;
    var text = '{"ImageUrn":[' +
      '{"Windows": "' + VMTestUtil.winImageUrn + '"},' +
      '{"Linux":"' + VMTestUtil.linuxImageUrn + '"}]}';

    fs.writeFile(UrnPath, text, function(err) {});
    callback();
  });
};
VMTestUtil.prototype.GetDockerLinuxImageList = function(location, suite, callback) {
  suite.execute('vm image list %s %s %s %s --json', location, this.linuxPublisher, this.linuxOffer, this.linuxDockerSkus, function(result) {
    result.exitStatus.should.equal(0);
    var allResources = JSON.parse(result.text);
    VMTestUtil.linuxImageUrn = allResources[0].urn;
    callback();
  });
};
VMTestUtil.prototype.getVMSize = function(location, suite, callback) {
  suite.execute('vm sizes -l %s --json', location, function(result) {
    result.exitStatus.should.equal(0);
    var allResources = JSON.parse(result.text);
    VMTestUtil.vmSize = null;
    var setVmSizeIfExists = function(allResources, querySizeStr) {
      if (!VMTestUtil.vmSize) {
        for (var i in allResources) {
          if (allResources[i].name.toLowerCase() === querySizeStr.toLowerCase()) {
            VMTestUtil.vmSize = allResources[i].name;
            break;
          }
        }
      }
    }
    
    setVmSizeIfExists(allResources, 'Standard_DS1');
    setVmSizeIfExists(allResources, 'Standard_D1');
    setVmSizeIfExists(allResources, 'Standard_D1_v2');
    VMTestUtil.vmSize = VMTestUtil.vmSize ? VMTestUtil.vmSize : 'Standard_A0';
    callback();
  });
};
VMTestUtil.prototype.checkImagefile = function(callback) {

  fs.open(ImageUrnPath, 'r+', function(err, fd) {
    if (err == null || err == undefined) {
      var data = fs.readFileSync(ImageUrnPath, 'utf8');
      var image = JSON.parse(data);
      VMTestUtil.linuxImageUrn = (image.ImageUrn[1].Linux != '' && image.ImageUrn[1].Linux != undefined) ? image.ImageUrn[1].Linux : '';
      VMTestUtil.winImageUrn = (image.ImageUrn[0].Windows != '' && image.ImageUrn[0].Windows != undefined) ? image.ImageUrn[0].Windows : '';
    } else {
      fs.writeFile(ImageUrnPath, Imagejsontext, function(err) {

      });
    }
    callback();
  });
};

VMTestUtil.prototype.createVMSSWithParamFile = function (dependencyObject, paramObject, groupName, suite, callback) {
  if (!(paramObject.vmssName && paramObject.paramFile)) {
    throw new Error('Both VMSS name and parameter file should be specified');
  }

  var cmds = [];

  if (!dependencyObject.storageAccount && paramObject.storageAccount) {
    cmds.push(
      util.format('storage account create -g %s --sku-name GRS --kind Storage --location %s %s --json', groupName, dependencyObject.location, paramObject.storageAccount)
    );
    dependencyObject.storageAccount = paramObject.storageAccount;
  }

  if (dependencyObject.networkSecurityGroupId) {
    cmds.push(
      util.format('vmss config network-security-group set --parameter-file %s --id %s --network-interface-configurations-index 0', paramObject.paramFile, dependencyObject.networkSecurityGroupId)
    );
  }

  if (dependencyObject.subnetId) {
    cmds.push(
      util.format('vmss config subnet set --parameter-file %s --id %s --network-interface-configurations-index 0 --ip-configurations-index 0', paramObject.paramFile, dependencyObject.subnetId)
    );
  }

  if (paramObject.nicDnsServer) {
    cmds.push(
      util.format('vmss config dns-servers set --parameter-file %s --index 0 --network-interface-configurations-index 0 --value %s', paramObject.paramFile, paramObject.nicDnsServer)
    );
  }

  if (paramObject.publicIpName) {
    cmds.push(
      util.format('vmss config public-ip-address-configuration set --parameter-file %s --ip-configurations-index 0 --network-interface-configurations-index 0 --name %s', paramObject.paramFile, paramObject.publicIpName)
    );
  }

  if (paramObject.idleTimeout) {
    cmds.push(
      util.format('vmss config public-ip-address-configuration set --parameter-file %s --ip-configurations-index 0 --network-interface-configurations-index 0 --idle-timeout-in-minutes %s --parse', paramObject.paramFile, paramObject.idleTimeout)
    );
  }

  if (paramObject.domainNameLabel) {
    cmds.push(
      util.format('vmss config public-ip-address-configuration-dns-settings set --parameter-file %s --ip-configurations-index 0 --network-interface-configurations-index 0 --domain-name-label %s', paramObject.paramFile, paramObject.domainNameLabel)
    );
  }

  if (dependencyObject.storageAccount && paramObject.storageCont) {
    cmds.push(
      util.format('vmss config vhd-containers set --parameter-file %s --index 0 --value https://%s.blob.core.windows.net/%s', paramObject.paramFile, paramObject.storageAccount, paramObject.storageCont)
    );
  }

  cmds.push(util.format('vmss create -g %s -n %s --parameter-file %s --json', groupName, paramObject.vmssName, paramObject.paramFile));

  function chain (cmd, res) {
    if (cmd) {
      testUtils.executeCommand(suite, retry, cmd, function (result) {
        result.exitStatus.should.equal(0);
        chain(cmds.shift(), result);
      });
    } else {
      callback(res);
    }
  }

  chain(cmds.shift())
};