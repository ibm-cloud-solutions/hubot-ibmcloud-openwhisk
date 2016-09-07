/*
* Licensed Materials - Property of IBM
* (C) Copyright IBM Corp. 2016. All Rights Reserved.
* US Government Users Restricted Rights - Use, duplication or
* disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
*/
'use strict';

const path = require('path');
const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');
const expect = require('chai').expect;
const mockUtils = require('./mock.utils.wsk.js');
const mockCFUtils = require('./mock.utils.cf.js');
const mockESUtils = require('./mock.utils.es.js');
const sprinkles = require('mocha-sprinkles');

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

// Length of time to wait for a message
const timeout = 10000;

// Leverage rewire to gain access to internal functions.
const rewire = require('rewire');

function waitForMessageQueue(room, len){
	return sprinkles.eventually({
		timeout: timeout
	}, function() {
		if (room.messages.length < len) {
			throw new Error('too soon');
		}
	}).then(() => false).catch(() => true).then((success) => {
		// Great.  Move on to tests
		expect(room.messages.length).to.eql(len);
	});
}

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Openwhisk via Reg Ex', function() {

	let room;
	let wskRewire;

	before(function() {
		mockUtils.setupMockery();
		mockCFUtils.setupMockery();
		mockESUtils.setupMockery();
		wskRewire = rewire(path.resolve(__dirname, '..', 'src', 'lib', 'wsk'));
		return;
	});

	beforeEach(function() {
		room = helper.createRoom();
		// Force all emits into a reply.
		room.robot.on('ibmcloud.formatter', function(event) {
			if (event.message) {
				event.response.reply(event.message);
			}
			else {
				event.response.send({attachments: event.attachments});
			}
		});
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `openwhisk list namespaces`', function() {
		it('should send a slack event with a list of openwhisk namespaces', function(done) {
			room.user.say('mimiron', '@hubot openwhisk list namespaces').then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.namespaces.in.progress', 'testOrg_testSpace')]);
				let event = room.messages[2][1];
				expect(event.attachments.length).to.eql(1);
				expect(event.attachments[0].text).to.eql(`testOrg_testSpace\nnamespace1\nnamespace2`);
				done();
			});
		});
	});

	context('user calls `namespace`', function() {
		beforeEach(function() {
			return room.user.say('mimiron', '@hubot openwhisk namespace');
		});

		it('should respond with the namespace', function() {
			expect(room.messages.length).to.eql(2);
			expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.namespace.current', 'testOrg_testSpace')]);

			wskRewire.__get__('getErrorResponse')('authentication error');
			wskRewire.__get__('getErrorResponse')('unknown error');
			wskRewire.__get__('getErrorResponse')();
		});
	});

	context('user calls `set namespace` with an unknown namespace', function() {
		it('should respond with the cannot find the namespace', function(done) {
			return room.user.say('mimiron', '@hubot openwhisk set namespace unknownSpace').then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages.length).to.eql(2);
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.namespace.not.found', 'unknownSpace')]);
				done();
			});
		});
	});

	context('user calls `set namespace` with an good namespace', function() {
		it('should respond with the can find the namespace', function(done) {
			return room.user.say('mimiron', '@hubot openwhisk set namespace testOrg_testSpace').then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages.length).to.eql(2);
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.namespace.new', 'testOrg_testSpace')]);
				done();
			});
		});
	});

	context('user calls `openwhisk list actions`', function() {
		it('should send a slack event with a list of openwhisk actions', function(done) {
			room.user.say('mimiron', '@hubot openwhisk list actions').then(() => {
				expect(room.messages.length).to.eql(4);
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.show.in.progress', 'testOrg_testSpace')]);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.show.actions', 'testOrg_testSpace')]);
				let event = room.messages[3][1];
				expect(event.attachments.length).to.eql(2);
				expect(event.attachments[0].title).to.eql('action1');
				done();
			});
		});
	});

	context('user calls `openwhisk invoke action`', function() {
		beforeEach(function() {
			// Don't move on from this until the promise resolves
			return room.user.say('mimiron', '@hubot openwhisk invoke action action1');
		});

		it('should respond with invoked', function(done) {
			expect(room.messages.length).to.eql(3);
			expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.invoke.in.progress', 'action1')]);
			expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.invoke.success', 'action1')]);
			done();
		});
	});

	context('user calls `openwhisk invoke action` with invalid action', function() {
		beforeEach(function() {
			// Don't move on from this until the promise resolves
			return room.user.say('mimiron', '@hubot openwhisk invoke action actionUnknown');
		});

		it('should respond with failure', function() {
			expect(room.messages.length).to.eql(3);
			expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.invoke.in.progress', 'actionUnknown')]);
			expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('openwhisk.invoke.failure', 'actionUnknown')]);
		});
	});

	context('user calls `openwhisk help`', function() {
		beforeEach(function() {
			return room.user.say('mimiron', '@hubot openwhisk help');
		});

		it('should respond with help', function() {
			expect(room.messages.length).to.eql(2);
			let help = 'hubot openwhisk invoke action [action] - ' + i18n.__('help.openwhisk.invoke.action') + '\n'
			+ 'hubot openwhisk list|show namespaces - ' + i18n.__('help.openwhisk.show.namespaces') + '\n'
			+ 'hubot openwhisk list|show actions - ' + i18n.__('help.openwhisk.show.actions') + '\n'
			+ 'hubot openwhisk namespace - ' + i18n.__('help.openwhisk.namespace') + '\n'
			+ 'hubot openwhisk set|use namespace [namespace] - ' + i18n.__('help.openwhisk.set.namespace') + '\n';

			expect(room.messages[1]).to.eql(['hubot', '@mimiron \n' + help]);
			return room.user.say('mimiron', 'yes');
		});
	});

});
