/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const path = require('path');
const nock = require('nock');
nock.disableNetConnect();
nock.enableNetConnect('localhost');
const testResources = require(path.resolve(__dirname, 'resources/openwhisk', 'test.resources.js'));

const endpoint = 'http://mytest';
const owVersion = 'v1';

module.exports = {

	setupMockery: function() {
		let owScope = nock(endpoint)
			.persist();

		owScope.get('/api/v1/namespaces')
			.reply(200, testResources.openwhiskNamespaces);
		owScope.get(`/api/${owVersion}/namespaces/testOrg_testSpace/actions`)
			.reply(200, testResources.openwhiskActions);
		owScope.post(`/api/${owVersion}/namespaces/testOrg_testSpace/actions/action1`)
			.reply(200, testResources.openwhiskAction);
		owScope.post(`/api/${owVersion}/namespaces/testOrg_testSpace/actions/action2`)
			.reply(200, {});

	},
	setupMockErrors: function(){
		nock.cleanAll();
		nock.disableNetConnect();
		let owErrorScope = nock(endpoint).persist();

		owErrorScope.get('/api/v1/namespaces')
			.reply(200, testResources.openwhiskNamespaces);
		owErrorScope.get(`/api/${owVersion}/namespaces/testOrg_testSpace/actions`)
			.reply(500, ['Some 500 error message from Openwhisk']);
		owErrorScope.post(`/api/${owVersion}/namespaces/testOrg_testSpace/actions/action1`)
			.reply(500, 'Some 500 error message from Openwhisk');
	}
};
