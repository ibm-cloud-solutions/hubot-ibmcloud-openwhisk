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
//	jamesjong
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

const activity = require('hubot-ibmcloud-activity-emitter');

const INVOKE = /openwhisk\s+invoke\s+action\s+(.*)/i;

module.exports = (robot) => {

	robot.on('openwhisk.action.invoke', (res, parameters) => {
		robot.logger.debug(`${TAG}: openwhisk.action.invoke Natural Language match.`);

		if (parameters && parameters.action) {
			const actionName = parameters.action;
			invokeAction(res, actionName, true);
		}
		else {
			robot.logger.error(`${TAG}: Error extracting Action Name from text=[${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.action');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	});
	robot.respond(INVOKE, {id: 'openwhisk.action.invoke'}, (res) => {
		robot.logger.debug(`${TAG}: openwhisk.action.invoke Reg Ex match.`);
		const actionName = res.match[1];
		invokeAction(res, actionName, false);
	});

	function invokeAction(res, actionName, isNLC) {
		robot.logger.debug(`${TAG}: openwhisk.action.invoke res.message.text=${res.message.text}.`);
		const namespace = wsk.openwhisk.activeNamespace(robot, res);
		// for now, we will not pass any params to the action
		var body = {};

		robot.logger.info(`${TAG}: Invoking openwhisk action ${actionName}`);
		let message = i18n.__('openwhisk.invoke.in.progress', actionName);
		robot.emit('ibmcloud.formatter', { response: res, message: message});
		robot.logger.info(`${TAG}: Asynch call using openwhisk library to invoke openwhisk action.`);
		wsk.openwhisk.invoke(actionName, namespace, body).then((resultJson) => {
			if (resultJson && resultJson.activationId) {
				let message = i18n.__('openwhisk.invoke.success', actionName);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
				activity.emitBotActivity(robot, res, {activity_id: 'activity.openwhisk.invoke.action'});
			}
			else {
				let message = i18n.__('openwhisk.invoke.failure', actionName);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
				if (isNLC) {
					let message = i18n.__('openwhisk.nlc.action.handling');
					robot.emit('ibmcloud.formatter', { response: res, message: message});
				}
				robot.logger.error(`${TAG}: openwhisk.invoke.failure - invalid result`);
			}
		}, (response) => {
			let message = i18n.__('openwhisk.invoke.failure', actionName);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
			robot.logger.error(`${TAG}: response=${response}`);
		}).catch((reason) => {
			robot.logger.error(`${TAG}: reason=${reason}`);
			robot.logger.error(reason.dumpstack);

			let message = i18n.__('openwhisk.invoke.failure', actionName);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});
	};
};
