[![Build Status](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-openwhisk.svg?branch=master)](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-openwhisk)
[![Coverage Status](https://coveralls.io/repos/github/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/badge.svg?branch=master)](https://coveralls.io/github/ibm-cloud-solutions/hubot-ibmcloud-openwhisk?branch=master)
[![Dependency Status](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/badge)](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-openwhisk)
[![npm](https://img.shields.io/npm/v/hubot-ibmcloud-openwhisk.svg?maxAge=2592000)](https://www.npmjs.com/package/hubot-ibmcloud-openwhisk)

# hubot-ibmcloud-openwhisk

Script package that exposes various IBM Cloud Open Whisk functionality through Hubot.

## Getting Started
  * [Usage](#usage)
  * [Commands](#commands)
  * [Open Whisk Integration](#openwhisk-integration)
  * [Hubot Adapter Setup](#hubot-adapter-setup)
  *	[Cognitive Setup](#cognitive-setup)
  * [Development](#development)
  * [License](#license)
  * [Contribute](#contribute)

## Usage

If you are new to Hubot visit the [getting started](https://hubot.github.com/docs/) content to get a basic bot up and running.  Next, follow these steps for adding this external script into your hubot:

1. `cd` into your hubot directory
2. Install this package via `npm install hubot-ibmcloud-openwhisk --save`
3. Install this package via `npm install hubot-ibmcloud-formatter --save`
4. Add `hubot-ibmcloud-openwhisk`, `hubot-ibmcloud-formatter` to your `external-scripts.json`
5. Add the necessary environment variables:
```
HUBOT_BLUEMIX_API=<Bluemix API URL>
HUBOT_BLUEMIX_ORG=<Bluemix Organization>
HUBOT_BLUEMIX_SPACE=<Bluemix space>
HUBOT_BLUEMIX_USER=<Bluemix User ID>
HUBOT_BLUEMIX_PASSWORD=<Password for the Bluemix use>
HUBOT_OPENWHISK_TOKEN=<Basic authentication token for Bluemix OpenWhisk>
```
6. Start up your bot & off to the races!


## Commands

- `hubot openwhisk invoke action [action]` - Invokes an OpenWhisk action in the active namespace.
- `hubot openwhisk list|show namespaces` - Lists all of the OpenWhisk namespaces.
- `hubot openwhisk list|show actions` - Lists all of the OpenWhisk actions in the active namespace.
- `hubot openwhisk namespace` - Gets current OpenWhisk namespace.
- `hubot openwhisk set|use namespace [namespace]` - Sets the active OpenWhisk namespace.
- `hubot openwhisk help` - Show available OpenWhisk commands.


## OpenWhisk Integration

Follow the instructions for [getting started with Bluemix OpenWhisk](https://console.ng.bluemix.net/docs/openwhisk/index.html) to obtain the authentication token. This token is the Basic Authenticaton header without the "Basic " prefix.

## Hubot Adapter Setup

Hubot supports a variety of adapters to connect to popular chat clients.  For more feature rich experiences you can setup the following adapters:
- [Slack setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/blob/master/docs/adapters/slack.md)
- [Facebook Messenger setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/blob/master/docs/adapters/facebook.md)

## Cognitive Setup

This project supports natural language interactions using Watson and other Bluemix services.  For more information on enabling these features, refer to [Cognitive Setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/docs/cognitiveSetup.md).

## Development

Please refer to the [CONTRIBUTING.md](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/blob/master/CONTRIBUTING.md) before starting any work.  Steps for running this script for development purposes:

### Configuration Setup

1. Create `config` folder in root of this project.
2. Create `env` in the `config` folder, with the following contents:
```
export HUBOT_BLUEMIX_API=<Bluemix API URL>
export HUBOT_BLUEMIX_ORG=<Bluemix Organization>
export HUBOT_BLUEMIX_SPACE=<Bluemix space>
export HUBOT_BLUEMIX_USER=<Bluemix User ID>
export HUBOT_BLUEMIX_PASSWORD=<Password for the Bluemix use>
export HUBOT_OPENWHISK_TOKEN=<Basic authentication token for Bluemix OpenWhisk>
```
3. In order to view content in chat clients you will need to add `hubot-ibmcloud-formatter` to your `external-scripts.json` file. Additionally, if you want to use `hubot-help` to make sure your command documentation is correct.  Create `external-scripts.json` in the root of this project, with the following contents:
```
[
	"hubot-help",
	"hubot-ibmcloud-formatter"
]
```
4. Lastly, run `npm install` to obtain all the dependent node modules.

### Running Hubot with Adapters

Hubot supports a variety of adapters to connect to popular chat clients.

If you just want to use:
 - Terminal: run `npm run start`
 - [Slack: link to setup instructions](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/blob/master/docs/adapters/slack.md)
 - [Facebook Messenger: link to setup instructions](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/blob/master/docs/adapters/facebook.md)

## License

See [LICENSE.txt](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/blob/master/LICENSE.txt) for license information.

## Contribute

Please check out our [Contribution Guidelines](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-openwhisk/blob/master/CONTRIBUTING.md) for detailed information on how you can lend a hand.
