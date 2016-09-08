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

// Leverage rewire to gain access to internal functions.
const rewire = require('rewire');

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
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `openwhisk help`', function() {
		it('should respond with the help', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.invoke.action'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.show.namespaces'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.show.actions'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.namespace'));
				expect(events[0].message).to.contain(i18n.__('help.openwhisk.set.namespace'));
			});

			room.user.say('mimiron', '@hubot openwhisk help');
			return p;
		});
	});

	context('user calls `openwhisk list namespaces`', function() {
		it('should respond with a list of openwhisk namespaces', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespaces.in.progress'));
				expect(events[1].attachments.length).to.eql(1);
				expect(events[1].attachments[0].text).to.eql(`testOrg_testSpace\nnamespace1\nnamespace2`);

				room.user.say('mimiron', '@hubot openwhisk list namespaces');
				return p;
			});
		});
	});

	context('user calls `openwhisk namespace`', function() {
		it('should respond with the current namespace', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespace.current', 'testOrg_testSpace'));
			});
			wskRewire.__get__('getErrorResponse')('authentication error');
			wskRewire.__get__('getErrorResponse')('unknown error');
			wskRewire.__get__('getErrorResponse')();

			room.user.say('mimiron', '@hubot openwhisk namespace');
			return p;
		});
	});

	context('user calls `set namespace` with an unknown namespace', function() {
		it('should respond with namespace not found', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespace.not.found', 'unknownSpace'));
			});

			room.user.say('mimiron', '@hubot openwhisk set namespace unknownSpace');
			return p;
		});
	});

	context('user calls `set namespace` with an valid namespace', function() {
		it('should respond with new current namespace', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.namespace.new', 'testOrg_testSpace'));
			});

			room.user.say('mimiron', '@hubot openwhisk set namespace testOrg_testSpace');
			return p;
		});
	});

	context('user calls `openwhisk list actions`', function() {
		it('should respond with a list of openwhisk actions', function() {
			let p = portend.thrice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.show.in.progress', 'testOrg_testSpace'));
				expect(events[1].message).to.be.eql(i18n.__('openwhisk.show.actions', 'testOrg_testSpace'));
				expect(events[2].attachments.length).to.eql(2);
				expect(events[2].attachments[0].title).to.eql('action1');
			});

			room.user.say('mimiron', '@hubot openwhisk list actions');
			return p;
		});
	});

	context('user calls `openwhisk invoke action`', function() {
		it('should respond with action invoked', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('openwhisk.invoke.in.progress', 'action1'));
				expect(events[1].message).to.be.eql(i18n.__('openwhisk.invoke.success', 'action1'));
			});

			room.user.say('mimiron', '@hubot openwhisk invoke action action1');
			return p;
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

			room.user.say('mimiron', '@hubot openwhisk invoke action actionUnknown');
			return p;
		});
	});
});
