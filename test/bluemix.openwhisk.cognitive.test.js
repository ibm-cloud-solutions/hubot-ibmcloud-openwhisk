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
const portend = require('portend');

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

	context('user calls `openwhisk help`', function() {
		it('should respond with help', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.invoke.action'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.show.namespaces'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.show.actions'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.namespace'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.set.namespace'));
			});

			let res = { message: {text: 'help openwhisk', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.help', res, {});
			return p;
		});
	});

	context('user calls `openwhisk list namespaces`', function() {
		it('should send a slack event with a list of openwhisk namespaces', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespaces.in.progress'));
				expect(events[1].attachments.length).to.eql(1);
				expect(events[1].attachments[0].text).to.eql(`testOrg_testSpace\nnamespace1\nnamespace2`);
			});

			let res = { message: {text: 'Show my namespaces'}, user: {id: 'anId'}, response: room };
			room.robot.emit('openwhisk.namespace.list', res, {});
			return p;
		});
	});

	context('user calls `openwhisk namespace`', function() {
		it('should respond with the current namespace', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespace.current', 'testOrg_testSpace'));
			});

			let res = { message: {text: 'Show my current namespace', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.namespace.get', res, {});
			return p;
		});
	});

	context('user calls `set namespace` with an unknown namespace', function() {
		it('should respond with namespace not found', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespace.not.found', 'unknownSpace'));
			});

			let res = { message: {text: 'Change my current namespace to unknownSpace'}, user: {id: 'anId'}, response: room };
			room.robot.emit('openwhisk.namespace.set', res, {namespace: 'unknownSpace'});
			return p;
		});
	});

	context('user calls `set namespace` with a valid namespace', function() {
		it('should respond with new current namespace', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespace.new', 'testOrg_testSpace'));
			});

			let res = { message: {text: 'Change my current namespace to testOrg_testSpace', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.namespace.set', res, {namespace: 'testOrg_testSpace'});
			return p;
		});

		it('should fail to set namespace due to missing namespace parameter', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('cognitive.parse.problem.namespace'));
			});

			let res = { message: {text: 'set namespace', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('openwhisk.namespace.set', res, {});
			return p;
		});
	});

	context('user calls `openwhisk list actions`', function() {
		it('should send a slack event with a list of openwhisk actions', function() {
			let p = portend.thrice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.show.in.progress', 'testOrg_testSpace'));
				expect(events[1].message).to.be.eql(i18n.__('openwhisk.show.actions', 'testOrg_testSpace'));
				expect(events[2].attachments.length).to.eql(2);
				expect(events[2].attachments[0].title).to.eql('action1');
			});

			let res = { message: {text: 'Show my openwhisk actions', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.action.list', res, {});
			return p;
		});
	});

	context('user calls `openwhisk invoke action`', function() {
		it('should respond with invoked', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.invoke.in.progress', 'action1'));
				expect(events[1].message).to.be.eql(i18n.__('openwhisk.invoke.success', 'action1'));
			});

			let res = { message: {text: 'invoke openwhisk action action1', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.action.invoke', res, {action: 'action1'});
			return p;
		});

		it('should fail invoke an action due to missing action parameter ', function() {
			room.robot.on('ibmcloud.formatter', (event) => {
				let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
					expect(events[0].message).to.be.a('string');
					expect(events[0].message).to.be.eql(i18n.__('cognitive.parse.problem.action'));
				});

				let res = { message: {text: 'I want to invoke action', user: {id: 'mimiron'}}, response: room };
				room.robot.emit('openwhisk.action.invoke', res, {});
				return p;
			});
		});
	});

	context('user calls `openwhisk invoke action` with invalid action', function() {
		it('should respond with failure', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.invoke.in.progress', 'actionUnknown'));
				expect(events[1].message).to.be.eql(i18n.__('openwhisk.invoke.failure', 'actionUnknown'));
			});

			let res = { message: {text: 'invoke openwhisk action actionUnknown', user: {id: 'anId'}}, response: room };
			room.robot.emit('openwhisk.action.invoke', res, {action: 'actionUnknown'});
			return p;
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
