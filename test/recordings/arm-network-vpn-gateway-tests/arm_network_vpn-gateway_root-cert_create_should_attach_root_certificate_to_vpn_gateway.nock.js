// This file has been autogenerated.

var profile = require('../../../lib/util/profile');

exports.getMockedProfile = function () {
  var newProfile = new profile.Profile();

  newProfile.addSubscription(new profile.Subscription({
    id: '947d47b4-7883-4bb9-9d85-c5e8e2f572ce',
    name: 'nrptest58.westus.validation.partner',
    user: {
      name: 'user@domain.example',
      type: 'user'
    },
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    state: 'Enabled',
    registeredProviders: [],
    _eventsCount: '1',
    isDefault: true
  }, newProfile.environments['AzureCloud']));

  return newProfile;
};

exports.setEnvironment = function() {
  process.env['AZURE_VM_TEST_LOCATION'] = 'westeurope';
};

exports.scopes = [[function (nock) { 
var result = 
nock('http://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway?api-version=2017-10-01')
  .reply(200, "{\r\n  \"name\": \"test-vpn-gateway\",\r\n  \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway\",\r\n  \"etag\": \"W/\\\"a0a65e40-5b3e-4cd6-b47d-53ec0e73ad7f\\\"\",\r\n  \"type\": \"Microsoft.Network/virtualNetworkGateways\",\r\n  \"location\": \"westeurope\",\r\n  \"tags\": {\r\n    \"tag1\": \"aaa\",\r\n    \"tag2\": \"bbb\",\r\n    \"tag3\": \"ccc\"\r\n  },\r\n  \"properties\": {\r\n    \"provisioningState\": \"Succeeded\",\r\n    \"resourceGuid\": \"28a3463e-ce32-49ce-a445-62d33993be8b\",\r\n    \"ipConfigurations\": [\r\n      {\r\n        \"name\": \"default-ip-config\",\r\n        \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/ipConfigurations/default-ip-config\",\r\n        \"etag\": \"W/\\\"a0a65e40-5b3e-4cd6-b47d-53ec0e73ad7f\\\"\",\r\n        \"properties\": {\r\n          \"provisioningState\": \"Succeeded\",\r\n          \"privateIPAllocationMethod\": \"Dynamic\",\r\n          \"publicIPAddress\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/publicIPAddresses/test-ip\"\r\n          },\r\n          \"subnet\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/GatewaySubnet\"\r\n          }\r\n        }\r\n      }\r\n    ],\r\n    \"sku\": {\r\n      \"name\": \"Standard\",\r\n      \"tier\": \"Standard\",\r\n      \"capacity\": 2\r\n    },\r\n    \"gatewayType\": \"Vpn\",\r\n    \"vpnType\": \"RouteBased\",\r\n    \"enableBgp\": false,\r\n    \"activeActive\": false,\r\n    \"vpnClientConfiguration\": {\r\n      \"vpnClientAddressPool\": {\r\n        \"addressPrefixes\": [\r\n          \"10.0.0.0/24\"\r\n        ]\r\n      },\r\n      \"vpnClientProtocols\": [],\r\n      \"vpnClientRootCertificates\": [],\r\n      \"vpnClientRevokedCertificates\": [],\r\n      \"vpnClientConnectionHealth\": {\r\n        \"vpnClientConnectionsCount\": 0,\r\n        \"totalIngressBytesTransferred\": 0,\r\n        \"totalEgressBytesTransferred\": 0\r\n      }\r\n    },\r\n    \"bgpSettings\": {\r\n      \"asn\": 64999,\r\n      \"bgpPeeringAddress\": \"10.12.255.30\",\r\n      \"peerWeight\": 2\r\n    }\r\n  }\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '2243',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': '71fe3a1e-5ba4-4e63-9dc2-bd22d4a1a002',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14995',
  'x-ms-correlation-request-id': 'e607eff7-baef-454b-b9ca-47ab7c93647f',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121744Z:e607eff7-baef-454b-b9ca-47ab7c93647f',
  date: 'Fri, 28 Jul 2017 12:17:43 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('https://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway?api-version=2017-10-01')
  .reply(200, "{\r\n  \"name\": \"test-vpn-gateway\",\r\n  \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway\",\r\n  \"etag\": \"W/\\\"a0a65e40-5b3e-4cd6-b47d-53ec0e73ad7f\\\"\",\r\n  \"type\": \"Microsoft.Network/virtualNetworkGateways\",\r\n  \"location\": \"westeurope\",\r\n  \"tags\": {\r\n    \"tag1\": \"aaa\",\r\n    \"tag2\": \"bbb\",\r\n    \"tag3\": \"ccc\"\r\n  },\r\n  \"properties\": {\r\n    \"provisioningState\": \"Succeeded\",\r\n    \"resourceGuid\": \"28a3463e-ce32-49ce-a445-62d33993be8b\",\r\n    \"ipConfigurations\": [\r\n      {\r\n        \"name\": \"default-ip-config\",\r\n        \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/ipConfigurations/default-ip-config\",\r\n        \"etag\": \"W/\\\"a0a65e40-5b3e-4cd6-b47d-53ec0e73ad7f\\\"\",\r\n        \"properties\": {\r\n          \"provisioningState\": \"Succeeded\",\r\n          \"privateIPAllocationMethod\": \"Dynamic\",\r\n          \"publicIPAddress\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/publicIPAddresses/test-ip\"\r\n          },\r\n          \"subnet\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/GatewaySubnet\"\r\n          }\r\n        }\r\n      }\r\n    ],\r\n    \"sku\": {\r\n      \"name\": \"Standard\",\r\n      \"tier\": \"Standard\",\r\n      \"capacity\": 2\r\n    },\r\n    \"gatewayType\": \"Vpn\",\r\n    \"vpnType\": \"RouteBased\",\r\n    \"enableBgp\": false,\r\n    \"activeActive\": false,\r\n    \"vpnClientConfiguration\": {\r\n      \"vpnClientAddressPool\": {\r\n        \"addressPrefixes\": [\r\n          \"10.0.0.0/24\"\r\n        ]\r\n      },\r\n      \"vpnClientProtocols\": [],\r\n      \"vpnClientRootCertificates\": [],\r\n      \"vpnClientRevokedCertificates\": [],\r\n      \"vpnClientConnectionHealth\": {\r\n        \"vpnClientConnectionsCount\": 0,\r\n        \"totalIngressBytesTransferred\": 0,\r\n        \"totalEgressBytesTransferred\": 0\r\n      }\r\n    },\r\n    \"bgpSettings\": {\r\n      \"asn\": 64999,\r\n      \"bgpPeeringAddress\": \"10.12.255.30\",\r\n      \"peerWeight\": 2\r\n    }\r\n  }\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '2243',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': '71fe3a1e-5ba4-4e63-9dc2-bd22d4a1a002',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14995',
  'x-ms-correlation-request-id': 'e607eff7-baef-454b-b9ca-47ab7c93647f',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121744Z:e607eff7-baef-454b-b9ca-47ab7c93647f',
  date: 'Fri, 28 Jul 2017 12:17:43 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('http://management.azure.com:443')
  .filteringRequestBody(function (path) { return '*';})
.put('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway?api-version=2017-10-01', '*')
  .reply(200, "{\r\n  \"name\": \"test-vpn-gateway\",\r\n  \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway\",\r\n  \"etag\": \"W/\\\"e5086e0c-bba3-4647-a29e-9f51d1d237e0\\\"\",\r\n  \"type\": \"Microsoft.Network/virtualNetworkGateways\",\r\n  \"location\": \"westeurope\",\r\n  \"tags\": {\r\n    \"tag1\": \"aaa\",\r\n    \"tag2\": \"bbb\",\r\n    \"tag3\": \"ccc\"\r\n  },\r\n  \"properties\": {\r\n    \"provisioningState\": \"Updating\",\r\n    \"resourceGuid\": \"28a3463e-ce32-49ce-a445-62d33993be8b\",\r\n    \"ipConfigurations\": [\r\n      {\r\n        \"name\": \"default-ip-config\",\r\n        \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/ipConfigurations/default-ip-config\",\r\n        \"etag\": \"W/\\\"e5086e0c-bba3-4647-a29e-9f51d1d237e0\\\"\",\r\n        \"properties\": {\r\n          \"provisioningState\": \"Updating\",\r\n          \"privateIPAllocationMethod\": \"Dynamic\",\r\n          \"publicIPAddress\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/publicIPAddresses/test-ip\"\r\n          },\r\n          \"subnet\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/GatewaySubnet\"\r\n          }\r\n        }\r\n      }\r\n    ],\r\n    \"sku\": {\r\n      \"name\": \"Standard\",\r\n      \"tier\": \"Standard\",\r\n      \"capacity\": 2\r\n    },\r\n    \"gatewayType\": \"Vpn\",\r\n    \"vpnType\": \"RouteBased\",\r\n    \"enableBgp\": false,\r\n    \"activeActive\": false,\r\n    \"vpnClientConfiguration\": {\r\n      \"vpnClientAddressPool\": {\r\n        \"addressPrefixes\": [\r\n          \"10.0.0.0/24\"\r\n        ]\r\n      },\r\n      \"vpnClientProtocols\": [],\r\n      \"vpnClientRootCertificates\": [\r\n        {\r\n          \"name\": \"test-root-cert\",\r\n          \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/vpnClientRootCertificates/test-root-cert\",\r\n          \"etag\": \"W/\\\"e5086e0c-bba3-4647-a29e-9f51d1d237e0\\\"\",\r\n          \"properties\": {\r\n            \"provisioningState\": \"Updating\",\r\n            \"publicCertData\": \"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tDQpNSUlDNXpDQ0FjK2dBd0lCQWdJUWZHMzNsNVlTcTVsSnRKTElEVTdXbFRBTkJna3Foa2lHOXcwQkFRc0ZBREFXDQpNUlF3RWdZRFZRUUREQXRRTWxOU2IyOTBRMlZ5ZERBZUZ3MHhOekEwTVRnd09UVXlORE5hRncwME9EQXpNekV5DQpNVEF3TURGYU1CWXhGREFTQmdOVkJBTU1DMUF5VTFKdmIzUkRaWEowTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGDQpBQU9DQVE4QU1JSUJDZ0tDQVFFQTRtRUZxL3JkeU1rK2YybU9mTlphQk5RbXdkUGtLR1NDdjlMY0tKK3dYYTE2DQp0OFV5NlBITkRFTFRWR0Q2T1dka3NpQmloa2JzR0k0TkRaUDZjV2hCMTJvOWdlOEpjRy9lSHYySjZXY202OGRFDQpvSmlvTys3ZXo1NG1IemUvWERvMFRRUEJBdUxvK2ZQZzRLVHFLYnd2QW5UVVIrR2d0YVgyQTdhN2ZDdGYvMElSDQpnK1lLZ3RoTkN5OWs0KzZ4SmVGS2d6UVpzUENNemsyWS85TXFUdStxelZYRWxmYjMxV1picFpaOHNOb3ZjNDZJDQpFYVBmVy9abDRLSFpaTGV6elpRdUd0TkVjdGVRUndUWTExaS9JOU9jSWRzYktha1N4SU5FeHl6ZFhVK0dQZ3VSDQpNYnlVWG03MHVWQUJXYVJxTlpJSjB1cE85MHJsWjc0aDh3bUIxdXUyTVFJREFRQUJvekV3THpBT0JnTlZIUThCDQpBZjhFQkFNQ0FnUXdIUVlEVlIwT0JCWUVGTGNyZklwc0FDbVgxcE5STDBITTZqdkE2N0UwTUEwR0NTcUdTSWIzDQpEUUVCQ3dVQUE0SUJBUURHckFjWTZNOEx5WEtyV3ZUZ1VyNUJ1TXlxRTlZSTU0b2p1NjIyZXM3a3h2N0g0YTJiDQpQMlYveTdrN0hKd3krOFBRcUlrVmdjSFZ6TE50UGxFMCsyUTU3emFHekRFbGdRcWNaanBYeVkzYlNDVjFZbWNqDQpwN2VidDdtK2hUZk1oWjM3eFI2Yzd4QjlMQjFack9ZMmdlZ2VlRWIxQS80KzFDbDczODNGdmd6V012T0x2WGFtDQprQTVWUGFhekdlOWVBZUFxRm1nSDFLZDFYOC8rZ2QxWmVFNnlXZ3QxQ1lkdjE5dEVnSEhBeDNmVVBJM3R5Nk9GDQp2SHQvY2IrUlBVR1d3aGlxN2l0U05MeHFzc2tiOFhJc1lrQmZoV0d1RTV5RWxWZk1oYzI4ckFJOHFjTUtUT3FlDQpRbDByaG5RT3QzMnNFbGdVSDZaU25SNkhDR2Iyam1aUU1WbngNCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=\"\r\n          }\r\n        }\r\n      ],\r\n      \"vpnClientRevokedCertificates\": []\r\n    },\r\n    \"bgpSettings\": {\r\n      \"asn\": 64999,\r\n      \"bgpPeeringAddress\": \"10.12.255.30\",\r\n      \"peerWeight\": 2\r\n    }\r\n  }\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '3981',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'retry-after': '10',
  'x-ms-request-id': 'ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec',
  'azure-asyncoperation': 'https://management.azure.com/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/providers/Microsoft.Network/locations/westeurope/operations/ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec?api-version=2017-10-01',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-writes': '1199',
  'x-ms-correlation-request-id': 'cc6cb1b3-b588-4e8d-82bf-79439fe57aa9',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121745Z:cc6cb1b3-b588-4e8d-82bf-79439fe57aa9',
  date: 'Fri, 28 Jul 2017 12:17:44 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('https://management.azure.com:443')
  .filteringRequestBody(function (path) { return '*';})
.put('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway?api-version=2017-10-01', '*')
  .reply(200, "{\r\n  \"name\": \"test-vpn-gateway\",\r\n  \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway\",\r\n  \"etag\": \"W/\\\"e5086e0c-bba3-4647-a29e-9f51d1d237e0\\\"\",\r\n  \"type\": \"Microsoft.Network/virtualNetworkGateways\",\r\n  \"location\": \"westeurope\",\r\n  \"tags\": {\r\n    \"tag1\": \"aaa\",\r\n    \"tag2\": \"bbb\",\r\n    \"tag3\": \"ccc\"\r\n  },\r\n  \"properties\": {\r\n    \"provisioningState\": \"Updating\",\r\n    \"resourceGuid\": \"28a3463e-ce32-49ce-a445-62d33993be8b\",\r\n    \"ipConfigurations\": [\r\n      {\r\n        \"name\": \"default-ip-config\",\r\n        \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/ipConfigurations/default-ip-config\",\r\n        \"etag\": \"W/\\\"e5086e0c-bba3-4647-a29e-9f51d1d237e0\\\"\",\r\n        \"properties\": {\r\n          \"provisioningState\": \"Updating\",\r\n          \"privateIPAllocationMethod\": \"Dynamic\",\r\n          \"publicIPAddress\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/publicIPAddresses/test-ip\"\r\n          },\r\n          \"subnet\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/GatewaySubnet\"\r\n          }\r\n        }\r\n      }\r\n    ],\r\n    \"sku\": {\r\n      \"name\": \"Standard\",\r\n      \"tier\": \"Standard\",\r\n      \"capacity\": 2\r\n    },\r\n    \"gatewayType\": \"Vpn\",\r\n    \"vpnType\": \"RouteBased\",\r\n    \"enableBgp\": false,\r\n    \"activeActive\": false,\r\n    \"vpnClientConfiguration\": {\r\n      \"vpnClientAddressPool\": {\r\n        \"addressPrefixes\": [\r\n          \"10.0.0.0/24\"\r\n        ]\r\n      },\r\n      \"vpnClientProtocols\": [],\r\n      \"vpnClientRootCertificates\": [\r\n        {\r\n          \"name\": \"test-root-cert\",\r\n          \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/vpnClientRootCertificates/test-root-cert\",\r\n          \"etag\": \"W/\\\"e5086e0c-bba3-4647-a29e-9f51d1d237e0\\\"\",\r\n          \"properties\": {\r\n            \"provisioningState\": \"Updating\",\r\n            \"publicCertData\": \"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tDQpNSUlDNXpDQ0FjK2dBd0lCQWdJUWZHMzNsNVlTcTVsSnRKTElEVTdXbFRBTkJna3Foa2lHOXcwQkFRc0ZBREFXDQpNUlF3RWdZRFZRUUREQXRRTWxOU2IyOTBRMlZ5ZERBZUZ3MHhOekEwTVRnd09UVXlORE5hRncwME9EQXpNekV5DQpNVEF3TURGYU1CWXhGREFTQmdOVkJBTU1DMUF5VTFKdmIzUkRaWEowTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGDQpBQU9DQVE4QU1JSUJDZ0tDQVFFQTRtRUZxL3JkeU1rK2YybU9mTlphQk5RbXdkUGtLR1NDdjlMY0tKK3dYYTE2DQp0OFV5NlBITkRFTFRWR0Q2T1dka3NpQmloa2JzR0k0TkRaUDZjV2hCMTJvOWdlOEpjRy9lSHYySjZXY202OGRFDQpvSmlvTys3ZXo1NG1IemUvWERvMFRRUEJBdUxvK2ZQZzRLVHFLYnd2QW5UVVIrR2d0YVgyQTdhN2ZDdGYvMElSDQpnK1lLZ3RoTkN5OWs0KzZ4SmVGS2d6UVpzUENNemsyWS85TXFUdStxelZYRWxmYjMxV1picFpaOHNOb3ZjNDZJDQpFYVBmVy9abDRLSFpaTGV6elpRdUd0TkVjdGVRUndUWTExaS9JOU9jSWRzYktha1N4SU5FeHl6ZFhVK0dQZ3VSDQpNYnlVWG03MHVWQUJXYVJxTlpJSjB1cE85MHJsWjc0aDh3bUIxdXUyTVFJREFRQUJvekV3THpBT0JnTlZIUThCDQpBZjhFQkFNQ0FnUXdIUVlEVlIwT0JCWUVGTGNyZklwc0FDbVgxcE5STDBITTZqdkE2N0UwTUEwR0NTcUdTSWIzDQpEUUVCQ3dVQUE0SUJBUURHckFjWTZNOEx5WEtyV3ZUZ1VyNUJ1TXlxRTlZSTU0b2p1NjIyZXM3a3h2N0g0YTJiDQpQMlYveTdrN0hKd3krOFBRcUlrVmdjSFZ6TE50UGxFMCsyUTU3emFHekRFbGdRcWNaanBYeVkzYlNDVjFZbWNqDQpwN2VidDdtK2hUZk1oWjM3eFI2Yzd4QjlMQjFack9ZMmdlZ2VlRWIxQS80KzFDbDczODNGdmd6V012T0x2WGFtDQprQTVWUGFhekdlOWVBZUFxRm1nSDFLZDFYOC8rZ2QxWmVFNnlXZ3QxQ1lkdjE5dEVnSEhBeDNmVVBJM3R5Nk9GDQp2SHQvY2IrUlBVR1d3aGlxN2l0U05MeHFzc2tiOFhJc1lrQmZoV0d1RTV5RWxWZk1oYzI4ckFJOHFjTUtUT3FlDQpRbDByaG5RT3QzMnNFbGdVSDZaU25SNkhDR2Iyam1aUU1WbngNCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=\"\r\n          }\r\n        }\r\n      ],\r\n      \"vpnClientRevokedCertificates\": []\r\n    },\r\n    \"bgpSettings\": {\r\n      \"asn\": 64999,\r\n      \"bgpPeeringAddress\": \"10.12.255.30\",\r\n      \"peerWeight\": 2\r\n    }\r\n  }\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '3981',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'retry-after': '10',
  'x-ms-request-id': 'ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec',
  'azure-asyncoperation': 'https://management.azure.com/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/providers/Microsoft.Network/locations/westeurope/operations/ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec?api-version=2017-10-01',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-writes': '1199',
  'x-ms-correlation-request-id': 'cc6cb1b3-b588-4e8d-82bf-79439fe57aa9',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121745Z:cc6cb1b3-b588-4e8d-82bf-79439fe57aa9',
  date: 'Fri, 28 Jul 2017 12:17:44 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('http://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/providers/Microsoft.Network/locations/westeurope/operations/ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec?api-version=2017-10-01')
  .reply(200, "{\r\n  \"status\": \"InProgress\"\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '30',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'retry-after': '10',
  'x-ms-request-id': '35959aea-e58e-4a93-980d-97a96d4ec140',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14995',
  'x-ms-correlation-request-id': '40d8e8dd-f712-4f60-ae5c-7e1154451181',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121816Z:40d8e8dd-f712-4f60-ae5c-7e1154451181',
  date: 'Fri, 28 Jul 2017 12:18:16 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('https://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/providers/Microsoft.Network/locations/westeurope/operations/ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec?api-version=2017-10-01')
  .reply(200, "{\r\n  \"status\": \"InProgress\"\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '30',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'retry-after': '10',
  'x-ms-request-id': '35959aea-e58e-4a93-980d-97a96d4ec140',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14995',
  'x-ms-correlation-request-id': '40d8e8dd-f712-4f60-ae5c-7e1154451181',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121816Z:40d8e8dd-f712-4f60-ae5c-7e1154451181',
  date: 'Fri, 28 Jul 2017 12:18:16 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('http://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/providers/Microsoft.Network/locations/westeurope/operations/ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec?api-version=2017-10-01')
  .reply(200, "{\r\n  \"status\": \"Succeeded\"\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '29',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': '836e9ccc-3dcb-4663-adce-8cadb620a82d',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14994',
  'x-ms-correlation-request-id': 'ceb6b3a2-d1c6-4085-9a5b-483c3fb76ad6',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121847Z:ceb6b3a2-d1c6-4085-9a5b-483c3fb76ad6',
  date: 'Fri, 28 Jul 2017 12:18:46 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('https://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/providers/Microsoft.Network/locations/westeurope/operations/ebee6e2c-dfa9-483f-b830-5a9ab3ad0bec?api-version=2017-10-01')
  .reply(200, "{\r\n  \"status\": \"Succeeded\"\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '29',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': '836e9ccc-3dcb-4663-adce-8cadb620a82d',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14994',
  'x-ms-correlation-request-id': 'ceb6b3a2-d1c6-4085-9a5b-483c3fb76ad6',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121847Z:ceb6b3a2-d1c6-4085-9a5b-483c3fb76ad6',
  date: 'Fri, 28 Jul 2017 12:18:46 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('http://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway?api-version=2017-10-01')
  .reply(200, "{\r\n  \"name\": \"test-vpn-gateway\",\r\n  \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway\",\r\n  \"etag\": \"W/\\\"2e899ad0-890f-417f-b1a5-382b19de8c7e\\\"\",\r\n  \"type\": \"Microsoft.Network/virtualNetworkGateways\",\r\n  \"location\": \"westeurope\",\r\n  \"tags\": {\r\n    \"tag1\": \"aaa\",\r\n    \"tag2\": \"bbb\",\r\n    \"tag3\": \"ccc\"\r\n  },\r\n  \"properties\": {\r\n    \"provisioningState\": \"Succeeded\",\r\n    \"resourceGuid\": \"28a3463e-ce32-49ce-a445-62d33993be8b\",\r\n    \"ipConfigurations\": [\r\n      {\r\n        \"name\": \"default-ip-config\",\r\n        \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/ipConfigurations/default-ip-config\",\r\n        \"etag\": \"W/\\\"2e899ad0-890f-417f-b1a5-382b19de8c7e\\\"\",\r\n        \"properties\": {\r\n          \"provisioningState\": \"Succeeded\",\r\n          \"privateIPAllocationMethod\": \"Dynamic\",\r\n          \"publicIPAddress\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/publicIPAddresses/test-ip\"\r\n          },\r\n          \"subnet\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/GatewaySubnet\"\r\n          }\r\n        }\r\n      }\r\n    ],\r\n    \"sku\": {\r\n      \"name\": \"Standard\",\r\n      \"tier\": \"Standard\",\r\n      \"capacity\": 2\r\n    },\r\n    \"gatewayType\": \"Vpn\",\r\n    \"vpnType\": \"RouteBased\",\r\n    \"enableBgp\": false,\r\n    \"activeActive\": false,\r\n    \"vpnClientConfiguration\": {\r\n      \"vpnClientAddressPool\": {\r\n        \"addressPrefixes\": [\r\n          \"10.0.0.0/24\"\r\n        ]\r\n      },\r\n      \"vpnClientProtocols\": [],\r\n      \"vpnClientRootCertificates\": [\r\n        {\r\n          \"name\": \"test-root-cert\",\r\n          \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/vpnClientRootCertificates/test-root-cert\",\r\n          \"etag\": \"W/\\\"2e899ad0-890f-417f-b1a5-382b19de8c7e\\\"\",\r\n          \"properties\": {\r\n            \"provisioningState\": \"Succeeded\",\r\n            \"publicCertData\": \"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tDQpNSUlDNXpDQ0FjK2dBd0lCQWdJUWZHMzNsNVlTcTVsSnRKTElEVTdXbFRBTkJna3Foa2lHOXcwQkFRc0ZBREFXDQpNUlF3RWdZRFZRUUREQXRRTWxOU2IyOTBRMlZ5ZERBZUZ3MHhOekEwTVRnd09UVXlORE5hRncwME9EQXpNekV5DQpNVEF3TURGYU1CWXhGREFTQmdOVkJBTU1DMUF5VTFKdmIzUkRaWEowTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGDQpBQU9DQVE4QU1JSUJDZ0tDQVFFQTRtRUZxL3JkeU1rK2YybU9mTlphQk5RbXdkUGtLR1NDdjlMY0tKK3dYYTE2DQp0OFV5NlBITkRFTFRWR0Q2T1dka3NpQmloa2JzR0k0TkRaUDZjV2hCMTJvOWdlOEpjRy9lSHYySjZXY202OGRFDQpvSmlvTys3ZXo1NG1IemUvWERvMFRRUEJBdUxvK2ZQZzRLVHFLYnd2QW5UVVIrR2d0YVgyQTdhN2ZDdGYvMElSDQpnK1lLZ3RoTkN5OWs0KzZ4SmVGS2d6UVpzUENNemsyWS85TXFUdStxelZYRWxmYjMxV1picFpaOHNOb3ZjNDZJDQpFYVBmVy9abDRLSFpaTGV6elpRdUd0TkVjdGVRUndUWTExaS9JOU9jSWRzYktha1N4SU5FeHl6ZFhVK0dQZ3VSDQpNYnlVWG03MHVWQUJXYVJxTlpJSjB1cE85MHJsWjc0aDh3bUIxdXUyTVFJREFRQUJvekV3THpBT0JnTlZIUThCDQpBZjhFQkFNQ0FnUXdIUVlEVlIwT0JCWUVGTGNyZklwc0FDbVgxcE5STDBITTZqdkE2N0UwTUEwR0NTcUdTSWIzDQpEUUVCQ3dVQUE0SUJBUURHckFjWTZNOEx5WEtyV3ZUZ1VyNUJ1TXlxRTlZSTU0b2p1NjIyZXM3a3h2N0g0YTJiDQpQMlYveTdrN0hKd3krOFBRcUlrVmdjSFZ6TE50UGxFMCsyUTU3emFHekRFbGdRcWNaanBYeVkzYlNDVjFZbWNqDQpwN2VidDdtK2hUZk1oWjM3eFI2Yzd4QjlMQjFack9ZMmdlZ2VlRWIxQS80KzFDbDczODNGdmd6V012T0x2WGFtDQprQTVWUGFhekdlOWVBZUFxRm1nSDFLZDFYOC8rZ2QxWmVFNnlXZ3QxQ1lkdjE5dEVnSEhBeDNmVVBJM3R5Nk9GDQp2SHQvY2IrUlBVR1d3aGlxN2l0U05MeHFzc2tiOFhJc1lrQmZoV0d1RTV5RWxWZk1oYzI4ckFJOHFjTUtUT3FlDQpRbDByaG5RT3QzMnNFbGdVSDZaU25SNkhDR2Iyam1aUU1WbngNCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=\"\r\n          }\r\n        }\r\n      ],\r\n      \"vpnClientRevokedCertificates\": [],\r\n      \"vpnClientConnectionHealth\": {\r\n        \"vpnClientConnectionsCount\": 0,\r\n        \"allocatedIpAddresses\": [],\r\n        \"totalIngressBytesTransferred\": 0,\r\n        \"totalEgressBytesTransferred\": 0\r\n      }\r\n    },\r\n    \"bgpSettings\": {\r\n      \"asn\": 64999,\r\n      \"bgpPeeringAddress\": \"10.12.255.30\",\r\n      \"peerWeight\": 2\r\n    }\r\n  }\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '4196',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': 'c194bb99-c2bf-4be2-8124-6e2ac329ced5',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14997',
  'x-ms-correlation-request-id': '695c07d8-1d94-42eb-84a6-d084760f51a7',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121848Z:695c07d8-1d94-42eb-84a6-d084760f51a7',
  date: 'Fri, 28 Jul 2017 12:18:47 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('https://management.azure.com:443')
  .get('/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway?api-version=2017-10-01')
  .reply(200, "{\r\n  \"name\": \"test-vpn-gateway\",\r\n  \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway\",\r\n  \"etag\": \"W/\\\"2e899ad0-890f-417f-b1a5-382b19de8c7e\\\"\",\r\n  \"type\": \"Microsoft.Network/virtualNetworkGateways\",\r\n  \"location\": \"westeurope\",\r\n  \"tags\": {\r\n    \"tag1\": \"aaa\",\r\n    \"tag2\": \"bbb\",\r\n    \"tag3\": \"ccc\"\r\n  },\r\n  \"properties\": {\r\n    \"provisioningState\": \"Succeeded\",\r\n    \"resourceGuid\": \"28a3463e-ce32-49ce-a445-62d33993be8b\",\r\n    \"ipConfigurations\": [\r\n      {\r\n        \"name\": \"default-ip-config\",\r\n        \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/ipConfigurations/default-ip-config\",\r\n        \"etag\": \"W/\\\"2e899ad0-890f-417f-b1a5-382b19de8c7e\\\"\",\r\n        \"properties\": {\r\n          \"provisioningState\": \"Succeeded\",\r\n          \"privateIPAllocationMethod\": \"Dynamic\",\r\n          \"publicIPAddress\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/publicIPAddresses/test-ip\"\r\n          },\r\n          \"subnet\": {\r\n            \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/GatewaySubnet\"\r\n          }\r\n        }\r\n      }\r\n    ],\r\n    \"sku\": {\r\n      \"name\": \"Standard\",\r\n      \"tier\": \"Standard\",\r\n      \"capacity\": 2\r\n    },\r\n    \"gatewayType\": \"Vpn\",\r\n    \"vpnType\": \"RouteBased\",\r\n    \"enableBgp\": false,\r\n    \"activeActive\": false,\r\n    \"vpnClientConfiguration\": {\r\n      \"vpnClientAddressPool\": {\r\n        \"addressPrefixes\": [\r\n          \"10.0.0.0/24\"\r\n        ]\r\n      },\r\n      \"vpnClientProtocols\": [],\r\n      \"vpnClientRootCertificates\": [\r\n        {\r\n          \"name\": \"test-root-cert\",\r\n          \"id\": \"/subscriptions/947d47b4-7883-4bb9-9d85-c5e8e2f572ce/resourceGroups/xplat-test-vpn-gateway/providers/Microsoft.Network/virtualNetworkGateways/test-vpn-gateway/vpnClientRootCertificates/test-root-cert\",\r\n          \"etag\": \"W/\\\"2e899ad0-890f-417f-b1a5-382b19de8c7e\\\"\",\r\n          \"properties\": {\r\n            \"provisioningState\": \"Succeeded\",\r\n            \"publicCertData\": \"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tDQpNSUlDNXpDQ0FjK2dBd0lCQWdJUWZHMzNsNVlTcTVsSnRKTElEVTdXbFRBTkJna3Foa2lHOXcwQkFRc0ZBREFXDQpNUlF3RWdZRFZRUUREQXRRTWxOU2IyOTBRMlZ5ZERBZUZ3MHhOekEwTVRnd09UVXlORE5hRncwME9EQXpNekV5DQpNVEF3TURGYU1CWXhGREFTQmdOVkJBTU1DMUF5VTFKdmIzUkRaWEowTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGDQpBQU9DQVE4QU1JSUJDZ0tDQVFFQTRtRUZxL3JkeU1rK2YybU9mTlphQk5RbXdkUGtLR1NDdjlMY0tKK3dYYTE2DQp0OFV5NlBITkRFTFRWR0Q2T1dka3NpQmloa2JzR0k0TkRaUDZjV2hCMTJvOWdlOEpjRy9lSHYySjZXY202OGRFDQpvSmlvTys3ZXo1NG1IemUvWERvMFRRUEJBdUxvK2ZQZzRLVHFLYnd2QW5UVVIrR2d0YVgyQTdhN2ZDdGYvMElSDQpnK1lLZ3RoTkN5OWs0KzZ4SmVGS2d6UVpzUENNemsyWS85TXFUdStxelZYRWxmYjMxV1picFpaOHNOb3ZjNDZJDQpFYVBmVy9abDRLSFpaTGV6elpRdUd0TkVjdGVRUndUWTExaS9JOU9jSWRzYktha1N4SU5FeHl6ZFhVK0dQZ3VSDQpNYnlVWG03MHVWQUJXYVJxTlpJSjB1cE85MHJsWjc0aDh3bUIxdXUyTVFJREFRQUJvekV3THpBT0JnTlZIUThCDQpBZjhFQkFNQ0FnUXdIUVlEVlIwT0JCWUVGTGNyZklwc0FDbVgxcE5STDBITTZqdkE2N0UwTUEwR0NTcUdTSWIzDQpEUUVCQ3dVQUE0SUJBUURHckFjWTZNOEx5WEtyV3ZUZ1VyNUJ1TXlxRTlZSTU0b2p1NjIyZXM3a3h2N0g0YTJiDQpQMlYveTdrN0hKd3krOFBRcUlrVmdjSFZ6TE50UGxFMCsyUTU3emFHekRFbGdRcWNaanBYeVkzYlNDVjFZbWNqDQpwN2VidDdtK2hUZk1oWjM3eFI2Yzd4QjlMQjFack9ZMmdlZ2VlRWIxQS80KzFDbDczODNGdmd6V012T0x2WGFtDQprQTVWUGFhekdlOWVBZUFxRm1nSDFLZDFYOC8rZ2QxWmVFNnlXZ3QxQ1lkdjE5dEVnSEhBeDNmVVBJM3R5Nk9GDQp2SHQvY2IrUlBVR1d3aGlxN2l0U05MeHFzc2tiOFhJc1lrQmZoV0d1RTV5RWxWZk1oYzI4ckFJOHFjTUtUT3FlDQpRbDByaG5RT3QzMnNFbGdVSDZaU25SNkhDR2Iyam1aUU1WbngNCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=\"\r\n          }\r\n        }\r\n      ],\r\n      \"vpnClientRevokedCertificates\": [],\r\n      \"vpnClientConnectionHealth\": {\r\n        \"vpnClientConnectionsCount\": 0,\r\n        \"allocatedIpAddresses\": [],\r\n        \"totalIngressBytesTransferred\": 0,\r\n        \"totalEgressBytesTransferred\": 0\r\n      }\r\n    },\r\n    \"bgpSettings\": {\r\n      \"asn\": 64999,\r\n      \"bgpPeeringAddress\": \"10.12.255.30\",\r\n      \"peerWeight\": 2\r\n    }\r\n  }\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '4196',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': 'c194bb99-c2bf-4be2-8124-6e2ac329ced5',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '14997',
  'x-ms-correlation-request-id': '695c07d8-1d94-42eb-84a6-d084760f51a7',
  'x-ms-routing-request-id': 'WESTEUROPE:20170728T121848Z:695c07d8-1d94-42eb-84a6-d084760f51a7',
  date: 'Fri, 28 Jul 2017 12:18:47 GMT',
  connection: 'close' });
 return result; }]];
