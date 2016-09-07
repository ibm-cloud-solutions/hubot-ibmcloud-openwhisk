/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const wsk = require('./wsk');
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;

const NAMESPACE = 'IBMcloudOpenwhisk';
const PARAM_ACTION = 'action';
const PARAM_NAMESPACE = 'namespace';

let functionsRegistered = false;


function buildGlobalName(parameterName) {
	return NAMESPACE + '_' + parameterName;
}
function buildGlobalFuncName(parameterName) {
	return NAMESPACE + '_func' + parameterName;
}

function registerEntityFunctions() {
	if (!functionsRegistered) {
		nlcconfig.setGlobalEntityFunction(buildGlobalFuncName(PARAM_ACTION), getActions);
		nlcconfig.setGlobalEntityFunction(buildGlobalFuncName(PARAM_NAMESPACE), getNamespaces);
		functionsRegistered = true;
	}
}

function getActions(robot, res, parameterName, parameters) {
	return new Promise(function(resolve, reject) {
		const namespace = wsk.openwhisk.activeNamespace(robot, res);
		wsk.openwhisk.getAllActions(namespace).then((result) => {
			let actions = result.map(function(action){
				return action.name;
			});
			nlcconfig.updateGlobalParameterValues(buildGlobalName(PARAM_ACTION), actions);
			resolve(actions);
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getNamespaces(robot, res, parameterName, parameters) {
	return new Promise(function(resolve, reject) {
		wsk.openwhisk.getNamespaces().then((result) => {
			nlcconfig.updateGlobalParameterValues(buildGlobalName(PARAM_NAMESPACE), result);
			resolve(result);
		}).catch(function(err) {
			reject(err);
		});
	});
}

module.exports.registerEntityFunctions = registerEntityFunctions;
module.exports.getActions = getActions;
module.exports.getNamespaces = getNamespaces;
