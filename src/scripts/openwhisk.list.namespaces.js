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

const path = require('path');
const TAG = path.basename(__filename);

const wsk = require('../lib/wsk');
const palette = require('hubot-ibmcloud-utils').palette;
const activity = require('hubot-ibmcloud-activity-emitter');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
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

const LIST = /openwhisk\s+(show|list)\s+namespaces/i;

module.exports = (robot) => {
	robot.on('openwhisk.namespace.list', (res) => {
		robot.logger.debug(`${TAG}: openwhisk.namespace.list Natural Language match.`);
		listNamespaces(res);
	});
	robot.respond(LIST, {id: 'openwhisk.namespace.list'}, (res) => {
		robot.logger.debug(`${TAG}: openwhisk.namespace.list Reg Ex match.`);
		listNamespaces(res);
	});
	function listNamespaces(res) {
		robot.logger.debug(`${TAG}: openwhisk.namespace.list res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Listing openwhisk namespaces...`);
		let message = i18n.__('openwhisk.namespaces.in.progress');
		robot.emit('ibmcloud.formatter', { response: res, message: message});
		robot.logger.info(`${TAG}: Asynch call using openwhisk library to get openwhisk namespaces.`);
		wsk.openwhisk.getNamespaces().then((resultJson) => {
			nlcconfig.updateGlobalParameterValues('IBMcloudOpenwhisk_namespace', resultJson);

			// Join the namespaces and return the result in an attachment.
			const namespaces = resultJson.join('\n');
			const attachment = {
				title: 'Namespaces:',
				color: palette.normal,
				text: namespaces
			};

			// Emit as an attachment
			robot.emit('ibmcloud.formatter', {
				response: res,
				attachments: [attachment]
			});
			activity.emitBotActivity(robot, res, {activity_id: 'activity.openwhisk.list.namespaces'});
		}, (response) => {
			let message = i18n.__('openwhisk.namespaces.failure', response);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
			robot.logger.error(`${TAG}: response=${response}`);
		}).catch((reason) => {
			robot.logger.error(`${TAG}: reason=${reason}`);
			robot.logger.error(reason.dumpstack);
			let message = i18n.__('openwhisk.namespaces.not.found');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});
	};
};
