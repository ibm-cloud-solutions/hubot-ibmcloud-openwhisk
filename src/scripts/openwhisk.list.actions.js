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
const palette = require('hubot-ibmcloud-utils').palette;
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

const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;

const LIST = /openwhisk\s+(show|list)\s+actions/i;

module.exports = (robot) => {

	robot.on('openwhisk.action.list', (res) => {
		robot.logger.debug(`${TAG}: openwhisk.action.list Natural Language match.`);
		listActions(res);
	});
	robot.respond(LIST, {id: 'openwhisk.action.list'}, (res) => {
		robot.logger.debug(`${TAG}: openwhisk.action.list Reg Ex match.`);
		listActions(res);
	});

	function listActions(res) {
		robot.logger.debug(`${TAG}: openwhisk.action.list res.message.text=${res.message.text}.`);

		const namespace = wsk.openwhisk.activeNamespace(robot, res);
		robot.logger.info(`${TAG}: Showing openwhisk actions for ${namespace}`);
		let message = i18n.__('openwhisk.show.in.progress', namespace);
		robot.emit('ibmcloud.formatter', { response: res, message: message});
		robot.logger.info(`${TAG}: Asynch call using openwhisk library to get all openwhisk actions.`);
		wsk.openwhisk.getAllActions(namespace).then((resultJson) => {

			var actionNames = resultJson.map(function(action){
				return action.name;
			});
			nlcconfig.updateGlobalParameterValues('IBMcloudOpenwhisk_action', actionNames);

			// Iterate the openwhisk actions and return info for match on name.
			const attachments = resultJson.map((action) => {
				const attachment = {
					title: action.name,
					color: palette.normal
				};
				attachment.fields = [
					{title: 'version', value: action.version, short: true},
					{title: 'publish', value: action.publish.toString(), short: true}
				];
				return attachment;
			});

			let message = i18n.__('openwhisk.show.actions', namespace);
			robot.emit('ibmcloud.formatter', { response: res, message: message});

			// Emit as an attachment
			robot.emit('ibmcloud.formatter', {
				response: res,
				attachments
			});
			activity.emitBotActivity(robot, res, {activity_id: 'activity.openwhisk.list.actions'});
		}, (response) => {
			let message = i18n.__('openwhisk.show.failure', namespace);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
			robot.logger.error(`${TAG}: response=${response}`);
		}).catch((reason) => {
			robot.logger.error(`${TAG}: reason=${reason}`);
			robot.logger.error(reason.dumpstack);
			let message = i18n.__('openwhisk.show.not.found', namespace);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});
	};
};
