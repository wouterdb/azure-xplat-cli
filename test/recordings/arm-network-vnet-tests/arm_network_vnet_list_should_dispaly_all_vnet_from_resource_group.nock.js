// This file has been autogenerated.

var profile = require('../../../lib/util/profile');

exports.getMockedProfile = function () {
  var newProfile = new profile.Profile();

  newProfile.addSubscription(new profile.Subscription({
    id: 'bfb5e0bf-124b-4d0c-9352-7c0a9f4d9948',
    name: 'CollaberaInteropTest',
    user: {
      name: 'user@domain.example',
      type: 'user'
    },
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    registeredProviders: [],
    isDefault: true
  }, newProfile.environments['AzureCloud']));

  return newProfile;
};

exports.setEnvironment = function() {
  process.env['AZURE_VM_TEST_LOCATION'] = 'westus';
};

exports.scopes = [[function (nock) { 
var result = 
nock('http://management.azure.com:443')
  .get('/subscriptions/bfb5e0bf-124b-4d0c-9352-7c0a9f4d9948/resourceGroups/xplatTestGCreatevnet6086/providers/Microsoft.Network/virtualnetworks?api-version=2015-05-01-preview')
  .reply(200, "{\r\n  \"value\": [\r\n    {\r\n      \"name\": \"xplatTestVnet8143\",\r\n      \"id\": \"/subscriptions/bfb5e0bf-124b-4d0c-9352-7c0a9f4d9948/resourceGroups/xplatTestGCreatevnet6086/providers/Microsoft.Network/virtualNetworks/xplatTestVnet8143\",\r\n      \"etag\": \"W/\\\"462afb0f-f871-4fae-8065-1df44c14d171\\\"\",\r\n      \"properties\": {\r\n        \"provisioningState\": \"Succeeded\",\r\n        \"addressSpace\": {\r\n          \"addressPrefixes\": [\r\n            \"10.0.0.0/12\"\r\n          ]\r\n        },\r\n        \"dhcpOptions\": {\r\n          \"dnsServers\": [\r\n            \"8.8.8.8\",\r\n            \"8.8.4.4\"\r\n          ]\r\n        }\r\n      },\r\n      \"location\": \"westus\"\r\n    }\r\n  ],\r\n  \"nextLink\": \"\"\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '662',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': 'd0ae7c99-67b5-46f3-9090-c1a415654acc',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0, Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '31968',
  'x-ms-correlation-request-id': '62f46461-84c5-4e78-b692-987bb9508a1a',
  'x-ms-routing-request-id': 'EASTASIA:20150427T104751Z:62f46461-84c5-4e78-b692-987bb9508a1a',
  date: 'Mon, 27 Apr 2015 10:47:50 GMT',
  connection: 'close' });
 return result; },
function (nock) { 
var result = 
nock('https://management.azure.com:443')
  .get('/subscriptions/bfb5e0bf-124b-4d0c-9352-7c0a9f4d9948/resourceGroups/xplatTestGCreatevnet6086/providers/Microsoft.Network/virtualnetworks?api-version=2015-05-01-preview')
  .reply(200, "{\r\n  \"value\": [\r\n    {\r\n      \"name\": \"xplatTestVnet8143\",\r\n      \"id\": \"/subscriptions/bfb5e0bf-124b-4d0c-9352-7c0a9f4d9948/resourceGroups/xplatTestGCreatevnet6086/providers/Microsoft.Network/virtualNetworks/xplatTestVnet8143\",\r\n      \"etag\": \"W/\\\"462afb0f-f871-4fae-8065-1df44c14d171\\\"\",\r\n      \"properties\": {\r\n        \"provisioningState\": \"Succeeded\",\r\n        \"addressSpace\": {\r\n          \"addressPrefixes\": [\r\n            \"10.0.0.0/12\"\r\n          ]\r\n        },\r\n        \"dhcpOptions\": {\r\n          \"dnsServers\": [\r\n            \"8.8.8.8\",\r\n            \"8.8.4.4\"\r\n          ]\r\n        }\r\n      },\r\n      \"location\": \"westus\"\r\n    }\r\n  ],\r\n  \"nextLink\": \"\"\r\n}", { 'cache-control': 'no-cache',
  pragma: 'no-cache',
  'content-length': '662',
  'content-type': 'application/json; charset=utf-8',
  expires: '-1',
  'x-ms-request-id': 'd0ae7c99-67b5-46f3-9090-c1a415654acc',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  server: 'Microsoft-HTTPAPI/2.0, Microsoft-HTTPAPI/2.0',
  'x-ms-ratelimit-remaining-subscription-reads': '31968',
  'x-ms-correlation-request-id': '62f46461-84c5-4e78-b692-987bb9508a1a',
  'x-ms-routing-request-id': 'EASTASIA:20150427T104751Z:62f46461-84c5-4e78-b692-987bb9508a1a',
  date: 'Mon, 27 Apr 2015 10:47:50 GMT',
  connection: 'close' });
 return result; }]];