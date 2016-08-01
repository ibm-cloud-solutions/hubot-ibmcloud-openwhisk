// Description:
//	Listens for commands to initiate actions against Bluemix
//
// Configuration:
//	 HUBOT_BLUEMIX_API Bluemix API URL
//	 HUBOT_BLUEMIX_ORG Bluemix Organization
//	 HUBOT_BLUEMIX_SPACE Bluemix space
//	 HUBOT_BLUEMIX_USER Bluemix User ID
//	 HUBOT_BLUEMIX_PASSWORD Password for the Bluemix User
//	 HUBOT_OPENWHISK_TOKEN Token for OpenWhisk usage
//
// Author:
//	chambrid
//
/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

const wsk = require('../lib/wsk');
const activity = require('hubot-ibmcloud-activity-emitter');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
var i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

const SPACE = /openwhisk\s+namespace/i;
const SET_SPACE = /openwhisk\s+(set|use)\s+namespace\s+(.*)/i;

module.exports = (robot) => {

	robot.on('openwhisk.namespace.get', (res) => {
		robot.logger.debug(`${TAG}: openwhisk.namespace.get Natural Language match.`);
		getNamespace(res);
	});
	robot.respond(SPACE, {id: 'openwhisk.namespace.get'}, (res) => {
		robot.logger.debug(`${TAG}: openwhisk.namespace.get Reg Ex match.`);
		getNamespace(res);
	});
	function getNamespace(res){
		robot.logger.debug(`${TAG}: openwhisk.namespace.get res.message.text=${res.message.text}.`);
		if (res && res.message && res.message.user && res.message.user.real_name && res.message.user.email_address) {
			robot.logger.info(`Requested current space for ${res.message.user.real_name} <${res.message.user.email_address}>`);
		}
		let namespace = wsk.openwhisk.activeNamespace(robot, res);
		let message = i18n.__('openwhisk.namespace.current', namespace);
		robot.emit('ibmcloud.formatter', { response: res, message: message});
	};


	robot.on('openwhisk.namespace.set', (res, parameters) => {
		robot.logger.debug(`${TAG}: openwhisk.namespace.set Natural Language match.`);
		if (parameters && parameters.namespace) {
			const name = parameters.namespace;
			setNamespace(res, name);
		}
		else {
			robot.logger.error(`${TAG}: Error extracting Namespace from text=[${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.namespace');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	});
	robot.respond(SET_SPACE, {id: 'openwhisk.namespace.set'}, (res) => {
		robot.logger.debug(`${TAG}: openwhisk.namespace.set Reg Ex match.`);
		const name = res.match[2];
		setNamespace(res, name);
	});
	function setNamespace(res, name) {
		robot.logger.debug(`${TAG}: openwhisk.namespace.set res.message.text=${res.message.text}.`);
		if (res && res.message && res.message.user && res.message.user.real_name && res.message.user.email_address) {
			robot.logger.info(`${TAG}: Setting space ${name} for ${res.message.user.real_name} <${res.message.user.email_address}>`);
		}
		robot.logger.info(`${TAG}: Asynch call using openwhisk library to get openwhisk namespaces.`);
		wsk.openwhisk.getNamespaces().then((resultJson) => {
			robot.logger.info(`${TAG}: resultJson: ` + JSON.stringify(resultJson));
			var found = false;
			resultJson.forEach(function(namespace) {
				if (name === namespace) {
					found = true;
					robot.brain.set(res.message.user.id + '_namespace', {namespace: name});
				}
			});
			if (!found) {
				let message = i18n.__('openwhisk.namespace.not.found', name);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
				robot.logger.info(`${TAG}: openwhisk namespace ${name} not found`);
			}
			else {
				let message = i18n.__('openwhisk.namespace.new', name);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
				activity.emitBotActivity(robot, res, {activity_id: 'activity.openwhisk.set.namespace'});
			}
		}).catch((reason) => {
			robot.logger.error(`${TAG}: reason=${reason}`);
			robot.logger.error(reason.dumpstack);
			let message = i18n.__('openwhisk.namespace.none');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});
	}
};
