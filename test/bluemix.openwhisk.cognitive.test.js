/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
'use strict';

const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');
const expect = require('chai').expect;
const mockUtils = require('./mock.utils.wsk.js');
const mockCFUtils = require('./mock.utils.cf.js');
const mockESUtils = require('./mock.utils.es.js');

const i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../src/messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');


describe('Interacting with Openwhisk via Natural Language -', function() {

	let room;

	before(function() {
		mockUtils.setupMockery();
		mockCFUtils.setupMockery();
		mockESUtils.setupMockery();
	});

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `openwhisk list namespaces`', function() {
		it('should send a slack event with a list of openwhisk namespaces', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql('Namespaces:');
					done();
				}
			});

			let res = { message: {text: 'Show my namespaces'}, user: {id: 'anId'}, response: room };
			room.robot.emit('openwhisk.namespace.list', res, {});
		});
	});

	context('user calls `namespace`', function() {
		it('should respond with the namespace', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('openwhisk.namespace.current', 'testOrg_testSpace'));
				done();
			});

			let res = { message: {text: 'Show my current namespace', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.namespace.get', res, {});
		});
	});

	context('user calls `set namespace` with an unknown namespace', function() {
		it('should respond with the cannot find the namespace', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('openwhisk.namespace.not.found', 'unknownSpace'));
				done();
			});

			let res = { message: {text: 'Change my current namespace to unknownSpace'}, user: {id: 'anId'}, response: room };
			room.robot.emit('openwhisk.namespace.set', res, {namespace: 'unknownSpace'});
		});
	});

	context('user calls `set namespace` with an good namespace', function() {
		it('should respond with the can find the namespace', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('openwhisk.namespace.new', 'testOrg_testSpace'));
				done();
			});

			let res = { message: {text: 'Change my current namespace to testOrg_testSpace', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.namespace.set', res, {namespace: 'testOrg_testSpace'});
		});

		it('should fail to set namespacedue to missing namespace parameter ', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('cognitive.parse.problem.namespace'));
					done();
				}
			});

			let res = { message: {text: 'set namespace', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('openwhisk.namespace.set', res, {});
		});
	});

	context('user calls `openwhisk list actions`', function() {
		it('should send a slack event with a list of openwhisk actions', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('openwhisk.show.in.progress', 'testOrg_testSpace'));
					done();
				}
			});

			let res = { message: {text: 'Show my openwhisk actions', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.action.list', res, {});

		});
	});

	context('user calls `openwhisk invoke action`', function() {
		it('should respond with invoked', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('openwhisk.invoke.in.progress', 'action1'));
					done();
				}
			});

			let res = { message: {text: 'invoke openwhisk action action1', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.action.invoke', res, {action: 'action1'});
		});

		it('should fail invoke an action due to missing action parameter ', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('cognitive.parse.problem.action'));
					done();
				}
			});

			let res = { message: {text: 'I want to invoke action', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('openwhisk.action.invoke', res, {});
		});
	});

	context('user calls `openwhisk invoke action` with invalid action', function() {
		it('should respond with failure', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('openwhisk.invoke.in.progress', 'actionUnknown'));
					done();
				}
			});

			let res = { message: {text: 'invoke openwhisk action actionUnknown', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.action.invoke', res, {action: 'actionUnknown'});
		});
	});

	context('user calls `openwhisk help`', function() {
		it('should respond with help', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain('openwhisk invoke action [action]');
					expect(event.message).to.contain('openwhisk list|show namespaces');
					expect(event.message).to.contain('openwhisk list|show actions');
					expect(event.message).to.contain('openwhisk namespace');
					expect(event.message).to.contain('openwhisk set|use namespace [namespace]');
					done();
				}
			});

			let res = { message: {text: 'help openwhisk', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.help', res, {});
		});
	});

	context('verify entity functions', function() {

		it('should retrieve set of actions', function(done) {
			const entities = require('../src/lib/openwhisk.entities');
			let res = { message: {text: '', user: {id: 'mimiron'}}, response: room };
			entities.getActions(room.robot, res, 'action', {}).then(function(actions) {
				expect(actions.length).to.eql(2);
				done();
			}).catch(function(error) {
				done(error);
			});
		});

		it('should retrieve set of namespaces', function(done) {
			const entities = require('../src/lib/openwhisk.entities');
			let res = { message: {text: '', user: {id: 'mimiron'}}, response: room };
			entities.getNamespaces(room.robot, res, 'namespace', {}).then(function(namespaces) {
				expect(namespaces.length).to.eql(3);
				done();
			}).catch(function(error) {
				done(error);
			});
		});
	});

});
