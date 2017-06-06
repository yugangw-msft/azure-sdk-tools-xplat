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

var should = require('should');
var sinon = require('sinon');
require('streamline').register();

var RoleAssignments = require('../../../../lib/commands/arm/role/roleAssignments._js');

describe('role assignments', function () {
  describe('should invoke authorization client with correct parameter', function () {


    var sampleScope = '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourceGroups/xDeploy';
    var sampleSubscriptionId = '1234';

    it('when use scope and no principal specified', function () {
      var authzClient = {
      roleAssignments: { listForScope: function (arScope, parameter, callback) { } },
      roleDefinitions: { list: function (scope,parameter,callback) { callback(null, { roleDefinitions: [] }); } }
      };
      sinon.stub(authzClient.roleAssignments, 'listForScope').callsArgWith(2, 
         null,{ roleAssignments: [] });

      //arrange
      var roleAssignments = new RoleAssignments(authzClient);
      //action
      //roleAssignments.query(false, '', { scope: sampleScope }, '', function () { });
      roleAssignments.queryAssignmentsForList('', { scope: sampleScope }, '',false,false,null,null,null, function (error,assignments) {
      });
      //assert
      var scopeArg = authzClient.roleAssignments.listForScope.firstCall.args[0];
      var param = authzClient.roleAssignments.listForScope.firstCall.args[1];
      
      scopeArg.scope.should.equal(sampleScope);
      param.atScope.should.be.true;
      should.not.exist(param.principalId);
    });

    it('when use a scope with only subscription id and an empty principal object', function () {
      var authzClient = {
      roleAssignments: { listForScope: function (arScope, parameter, callback) { } },
      roleDefinitions: { list: function (scope,parameter,callback) { callback(null, { roleDefinitions: [] }); } }
      };
      sinon.stub(authzClient.roleAssignments, 'listForScope').callsArgWith(2/*3rd parameter of 'listForScope' is the callback*/, 
         null,{ roleAssignments: [] });
      //arrange
      var roleAssignments = new RoleAssignments(authzClient);
      var sampleScope = { subscriptionId: sampleSubscriptionId };
      
      //action
      roleAssignments.queryAssignmentsForList(null , {scope:sampleScope},null,null,false,false,null, { subscriptionId: '1234' },function () { });
      
      //assert
      var scopeArg = authzClient.roleAssignments.listForScope.firstCall.args[0];
      var param = authzClient.roleAssignments.listForScope.firstCall.args[1];
      scopeArg.scope.subscriptionId.should.equal(sampleSubscriptionId);
      param.atScope.should.be.true;
      should.not.exist(param.principalId);
    });


    it('when principal object is configured and query for listing assignment', function () {
      //arrange
          var samplePrincipalId = 'f09fea55-4947-484b-9b25-c67ddd8795ac';
          var sampleRoleAssignments = [{
            id: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourcegroups/somegroup/providers/Microsoft.Authorization/roleAssignments/6e13f985-87e4-4f00-afda-c46856a4270a',
            name: '6e13f985-87e4-4f00-afda-c46856a4270a',
            type: 'Microsoft.Authorization/roleAssignments',
            properties: {
              roleDefinitionId: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7',
              principalId: samplePrincipalId,
              scope: '/subscriptions/1234',
              roleName: 'Reader',
            }
          }];
          var authzClient = {
            roleAssignments: { list: function (parameter, callback) {callback(null,{roleAssignments:sampleRoleAssignments}); 
            } },
            roleDefinitions: { list: function (scope,parameter,callback) { callback(null, { roleDefinitions: [] }); } }
          };
          sinon.stub(authzClient.roleAssignments, 'list').callsArgWith(1, 
             { roleAssignments:sampleRoleAssignments});
      var roleAssignments = new RoleAssignments(authzClient);
      var sampleScope = '/subscriptions/1234';
      var sampleObjectId = '1234';
      //action
      roleAssignments.queryAssignmentsForList({ objectId: '1234' },sampleScope,'',null,null,false,false,null, function (error) {       });
      //assert
      var param = authzClient.roleAssignments.list.firstCall.args[0];
      
      param.atScope.should.be.false;
      param.principalId.should.equal(sampleObjectId);
    });

  })
  


  it('should show object id if the principal id can\'t be resolved', function (done) {
    //setup
    var samplePrincipalId = 'f09fea55-4947-484b-9b25-c67ddd8795ac';
    
    var sampleRoleAssignments = [{
      id: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourcegroups/somegroup/providers/Microsoft.Authorization/roleAssignments/6e13f985-87e4-4f00-afda-c46856a4270a',
      name: '6e13f985-87e4-4f00-afda-c46856a4270a',
      type: 'Microsoft.Authorization/roleAssignments',
      properties: {
        roleDefinitionId: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f606fba81ae7',
        principalId: samplePrincipalId,
        scope: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourcegroups/adminonly',
        roleName: 'Reader',
      }
    }];
    var authzClient = {
      roleAssignments: {
        listForScope: function (arScope, parameter, callback) { callback(null, { roleAssignments: sampleRoleAssignments }); }
      },
      roleDefinitions: { 
        list: function (scope,parameter,callback) { callback(null, { roleDefinitions: [] }); } }
    };
    var graphClient = {
      objects: { getObjectsByObjectIds: function (objectIds, callback) { callback(null, [{ objectId: 'f09fea55-4947-484b-9b25-c67ddd8795ac' }]); } }
    };
    var roleAssignments = new RoleAssignments(authzClient, graphClient);
    var sampleScope = '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourceGroups/somegroup';
    //action
    var assignmentsReturned =roleAssignments.queryAssignmentsForList(samplePrincipalId, { scope: sampleScope }, '',false,false,null,null,null, function (error,assignments) {
      //assert
      assignments[0].properties.principalId.should.equal(samplePrincipalId);
      done();
    });
  });
  
  it('should construct correct scope using resource group and resource', function () {
    //arrange
    var sampleScopeInfo = {
      scope: '',
      resourceGroup: 'myGroup',
      resourceType: 'Microsoft.Sql/servers',
      resourceName: 'mySqlServer',
      parent: '',
      subscriptionId: 'someSubscriptionId'
    };
    
    //action
    var scope = RoleAssignments.buildScopeString(sampleScopeInfo);
    
    //assert
    scope.should.equal('/subscriptions/' + sampleScopeInfo.subscriptionId 
      + '/resourcegroups/' + sampleScopeInfo.resourceGroup 
      + '/providers/Microsoft.Sql/servers/' + sampleScopeInfo.resourceName);
  });
  
  it('should construct correct scope using group, resource and parent resource', function () {
    //arrange
    var sampleScopeInfo = {
      scope: '',
      resourceGroup: 'myGroup',
      resourceType: 'Microsoft.Sql/servers/database',
      resourceName: 'mySqlDB',
      parent: 'servers/myServer',
      subscriptionId: 'someSubscriptionId'
    };
    
    //action
    var scope = RoleAssignments.buildScopeString(sampleScopeInfo);
    
    //assert
    scope.should.equal('/subscriptions/' + sampleScopeInfo.subscriptionId 
      + '/resourcegroups/' + sampleScopeInfo.resourceGroup 
      + '/providers/Microsoft.Sql/servers/myServer/database/' + sampleScopeInfo.resourceName);
  });

  it('validate that scope is well-formatted', function () {
    //arrange
    var sampleScopeInfos = [
      {scope: '/'}, 
      {scope: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1'}, 
      {scope: '/subscription', expectedError: 'Scope \'/subscription\' should begin with \'/subscriptions\' or \'/providers\'.'},
      {scope: '/subscriptions', expectedError: 'Scope \'/subscriptions\' should have even number of parts.'},
      {scope: '/subscriptions//', expectedError: 'Scope \'/subscriptions//\' should not have any empty part.'},
      {scope: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/wrong/groupname', expectedError: 'Scope \'/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/wrong/groupname\' should begin with \'/subscriptions/<subid>/resourceGroups\'.'}, 
      {scope: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourceGroups/groupname/wrong/providername', expectedError: 'Scope \'/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourceGroups/groupname/wrong/providername\' should begin with \'/subscriptions/<subid>/resourceGroups/<groupname>/providers\'.'}, 
      {scope: '/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourceGroups/groupname/providers/providername', expectedError: 'Scope \'/subscriptions/2d006e8c-61e7-4cd2-8804-b4177a4341a1/resourceGroups/groupname/providers/providername\' should have at least one pair of resource type and resource name. e.g. \'/subscriptions/<subid>/resourceGroups/<groupname>/providers/<providername>/<resourcetype>/<resourcename>\'.'} 
    ];
    
    function buildScopeString(element, index, array) {
      try {
        var ret = RoleAssignments.buildScopeString(element);
        ret.should.equal(element.scope);      
      } catch (err){
        err.message.should.equal(element.expectedError);
      }
    }
    
    //action and assert
    sampleScopeInfos.forEach(buildScopeString);
  });

});