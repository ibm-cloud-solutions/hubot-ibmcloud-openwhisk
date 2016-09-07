// Description:
//	Listens for commands to initiate actions against Bluemix for openwhisk
//
// Configuration:
//	 HUBOT_BLUEMIX_API Bluemix API URL
//	 HUBOT_BLUEMIX_ORG Bluemix Organization
//	 HUBOT_BLUEMIX_SPACE Bluemix space
//	 HUBOT_BLUEMIX_USER Bluemix User ID
//	 HUBOT_BLUEMIX_PASSWORD Password for the Bluemix User
//
// Commands:
//   hubot openwhisk help - Show available commands in the openwhisk category.
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

const path = require('path');
const TAG = path.basename(__filename);

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

const OPENWHISK_HELP = /openwhisk\s+help/i;

module.exports = (robot) => {
	robot.on('openwhisk.help', (res) => {
		robot.logger.debug(`${TAG}: openwhisk.help Natural Language match.`);
		help(res);
	});
	robot.respond(OPENWHISK_HELP, {id: 'openwhisk.help'}, (res) => {
		robot.logger.debug(`${TAG}: openwhisk.help Reg Ex match.`);
		help(res);
	});

	function help(res) {
		robot.logger.debug(`${TAG}: openwhisk help res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Listing help openwhisk...`);

		//	 hubot openwhisk show|list namespaces
		//	 hubot openwhisk show|list openwhisk actions
		//	 hubot openwhisk invoke action [action]
		//	 hubot openwhisk namespace - Show the current OpenWhisk namespace
		//  hubot openwhisk set|use namespace [namespace] - Set your active namespace

		let help = robot.name + ' openwhisk invoke action [action] - ' + i18n.__('help.openwhisk.invoke.action') + '\n'
			+ robot.name + ' openwhisk list|show namespaces - ' + i18n.__('help.openwhisk.show.namespaces') + '\n'
			+ robot.name + ' openwhisk list|show actions - ' + i18n.__('help.openwhisk.show.actions') + '\n'
			+ robot.name + ' openwhisk namespace - ' + i18n.__('help.openwhisk.namespace') + '\n'
			+ robot.name + ' openwhisk set|use namespace [namespace] - ' + i18n.__('help.openwhisk.set.namespace') + '\n';

		robot.emit('ibmcloud.formatter', { response: res, message: '\n' + help});
	};
};
