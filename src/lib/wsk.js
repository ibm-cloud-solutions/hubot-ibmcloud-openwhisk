/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const request = require('request');

const env = {
	endpoint: process.env.HUBOT_BLUEMIX_API,
	org: process.env.HUBOT_BLUEMIX_ORG,
	space: process.env.HUBOT_BLUEMIX_SPACE,
	openwhiskToken: process.env.HUBOT_OPENWHISK_TOKEN
};


/**
 * Returns a user friendly response for error messages.
 */
function getErrorResponse(err) {
	if (err) {
		if (err.indexOf('authentication') !== -1) {
			// authentication failed but token was set
			return 'Authenication failed.  Check that the HUBOT_OPENWHISK_TOKEN environment variable is set to a valid token.';
		}
		return err;
	}
	return 'Unknown error.';
}

/**
 * This public class manages the operations related with Open Whisk in Bluemix
 */
class OpenWhisk {

	/**
	 * The constructor that sets the containers api endpoint
	 */
	constructor() {
		this.endpoint = (env.endpoint || '').replace('/api', '/openwhisk');
		this.namespace = env.org + '_' + env.space;
	}

	/**
	 * Gets all of the namespaces
	 *
	 * @return {array} [Array of JSON response about the namespaces]
	 */
	getNamespaces() {
		// GET api/v1/namespaces
		var options = {
			method: 'GET',
			url: this.endpoint + '/api/v1/namespaces',
			headers: {
				Authorization: 'Basic ' + env.openwhiskToken,
				Accept: 'application/json'
			}
		};
		var promise = new Promise((resolve, reject) => {
			if (env.openwhiskToken) {
				request(options, function(error, response, body) {
					if (error) {
						reject(body);
					}
					else if (body) {
						var resultJson = JSON.parse(body);
						if (resultJson && resultJson.error) {
							reject(getErrorResponse(resultJson.error));
						}
						else {
							resolve(resultJson);
						}
					}
				});
			}
			else {
				reject('Error - The HUBOT_OPENWHISK_TOKEN is not set; OpenWhisk operations cannot be performed.');
			}
		});
		return promise;
	}

	/**
	 * Gets all of the actions
	 *
	 * @param {string} namespace  [The namespace where the OpenWhisk action exists]
	 * @return {array} [Array of JSON response about the Openwhisk actions]
	 */
	getAllActions(namespace) {
		// GET api/v1/namespaces/{namespace}/actions

		var options = {
			method: 'GET',
			url: this.endpoint + '/api/v1/namespaces/' + namespace + '/actions',
			headers: {
				Authorization: 'Basic ' + env.openwhiskToken,
				Accept: 'application/json'
			}
		};
		var promise = new Promise((resolve, reject) => {
			if (env.openwhiskToken) {
				request(options, function(error, response, body) {
					if (error) {
						reject(body);
					}
					else {
						var resultJson = JSON.parse(body);
						if (resultJson && resultJson.error) {
							reject(getErrorResponse(resultJson.error));
						}
						else {
							resolve(resultJson);
						}
					}
				});
			}
			else {
				reject('Error - The HUBOT_OPENWHISK_TOKEN is not set; OpenWhisk operations cannot be performed.');
			}
		});
		return promise;
	}

	/**
	 * Invoke an OpenWhisk Action
	 *
	 * @param  {String} action     [OpenWhisk action name]
	 * @param {string} namespace  [The namespace where the OpenWhisk action exists]
	 * @param {string} param      [The parameter to pass to the OpenWhisk action]
	 * @return {JSON}              [information about the action taken]
	 */
	invoke(action, namespace, param) {
		// POST /api/v1/namespaces/{namespace}/actions/{actionName}
		var options = {
			method: 'POST',
			url: this.endpoint + '/api/v1/namespaces/' + namespace + '/actions/' + action,
			headers: {
				Authorization: 'Basic ' + env.openwhiskToken,
				Accept: 'application/json'
			}
		};
		if (param) {
			options.json = true;
			options.body = param;
		}
		var promise = new Promise((resolve, reject) => {
			if (env.openwhiskToken) {
				request(options, function(error, response, body) {
					if (error) {
						reject(body);
					}
					else {
						resolve(body);
					}
				});
			}
			else {
				reject('Error - The HUBOT_OPENWHISK_TOKEN is not set; OpenWhisk operations cannot be performed.');
			}
		});
		return promise;
	}

	/*
	 * Returns active namespace.  If invoked in context of hubot native adapters supporting the notion of user, then the space
	 * will be specific to each user.
	 *
	 * @param {object} robot  [The robot]
	 * @param {object} res    [The response object]
	 * @return {string}      [The active namespace for the user]
	 */
	activeNamespace(robot, res) {
		let namespace = this.namespace;
		if (robot && res && res.message && res.message.user && res.message.user.id) {
			const pref = robot.brain.get(res.message.user.id + '_namespace');
			if (pref && pref.namespace) {
				namespace = pref.namespace;
			}
		}
		return namespace;
	}

}

const wsk = new OpenWhisk();

module.exports.openwhisk = wsk;
