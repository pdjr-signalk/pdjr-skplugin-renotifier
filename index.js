/*
 * Copyright 2018 Paul Reeve <paul@pdjr.eu>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const fs = require('fs');
const bacon = require('baconjs');

const NOTIFIER_DIRECTORY = __dirname + "/bin/";

module.exports = function(app) {
	var plugin = {};
	var unsubscribes = [];

	plugin.id = "renotifier";
	plugin.name = "Renotifier";
	plugin.description = "Take external action on a Signal K notification";

	plugin.schema = function() {
		return({	
			type: "object",
			properties: {
				scan: {
					title: "Scan script directory",
					type: "boolean",
					default: true
				},
				paths: {
					title: "Trigger paths",
					type: "string",
					default: ""
				},
				notifiers: {
					title: "Notifiers",
					type: "array",
					default: [],
					items: {
						type: "object",
						properties: {
							name: {
								title: "Name",
								type: "string",
								default: ""
							},
							description: {
								title: "Description",
								type: "string",
								default: ""
							},
							triggerstates: {
								title: "Trigger states",
								type: "array",
								items: {
									type: "string",
									enum: ["normal","alert","alarm","emergency"]
								},
								uniqueItems: true
							},
							arguments: {
								title: "Arguments",
								description: "",
								type: "string",
								default: ""
							}
						}
					}
				}
			}
		});
	}
 
	plugin.uiSchema = {
		paths: {
			"ui:widget": "textarea"
		},
		notifiers: {
			"ui:options": {
				addable: false,
				orderable: false
			},
			items: {
				name: {
					"ui:disabled": true
				},
				triggerstates: {
					"ui:widget": {
						component: "checkboxes",
						options: {
							inline: true
						}
					}
				}
			}
		}
	}

	plugin.start = function(options) {

		if (options.scan) {
			try {
				var updatednotifiers = loadNotifierOptionsFromDisk(options.notifiers);
				try {
					options.notifiers = updatednotifiers;
					options.scan = false;
					app.savePluginOptions(options);
					logN("notifiers changed on disk (" + options.notifiers.map(v => v['name']).join(',') + ")");
				} catch(e) {
					logE("cannot save options");
					return;
				}
			} catch(e) {
				logE(e);
				return;
			}
		}

		var activeNotifierNames = options.notifiers.filter(v => ((v['triggerstates'].length > 0) && (v['triggerpaths'] != "") && (v['arguments'] != ""))).map(v => v['name']);

		if (activeNotifierNames.length == 0) {
			logN("There are no configured notifier scripts");
			return;
		} else {
			logN("Notifying by " + activeNotifierNames.join(','));

			try {
				var stream = app.streambundle.getSelfBus("notifications.tanks.wasteWater.0.currentLevel");
				unsubscribes.push(stream.onValue(function(v) {
					logN("Notification " + JSON.stringify(v));
				}));
			} catch(e) {
				logE("Failed " + e);
			}
		}
	}

	plugin.stop = function() {
		unsubscribes.forEach(f => f());
		unsubscribes = [];
	}

	function loadNotifierOptionsFromDisk(notifieroptions) {
		var retval = notifieroptions;

		try {
			retval = fs.readdirSync(NOTIFIER_DIRECTORY).map(function(entry) {
				var description = "";
				var triggerstates = [];
				var arguments = "";

				try { description = execSync(NOTIFIER_DIRECTORY + entry).toString().trim(); } catch(err) {  }
				if (notifieroptions.map(v => v['name']).includes(entry)) {
					triggerstates = notifieroptions.reduce((a,v) => ((a !== undefined)?a:((v['name'] == entry)?v['triggerstates']:a)),undefined);
					arguments = notifieroptions.reduce((a,v) => ((a !== undefined)?a:((v['name'] == entry)?v['arguments']:a)),undefined);
				}
				
				return({
					"name": entry,
					"description": description,
					"triggerstates": triggerstates,
					"arguments": arguments
				});
			});
		} catch(e) {
			logE("error reading script directory");
			throw("error reading script directory");
		}
		return(retval);
	}

	function log(prefix, terse, verbose) {
		if (verbose) console.log(plugin.id + ": " + prefix + ": " + verbose);
		if (terse) {
			if (prefix !== "error") { app.setProviderStatus(terse); } else { app.setProviderError(terse); }
		}
	}

	function logE(terse, verbose) { log("error", terse, (verbose === undefined)?terse:verbose); }
	function logW(terse, verbose) { log("warning", terse, (verbose === undefined)?terse:verbose); }
	function logN(terse, verbose) { log("notice", terse, (verbose === undefined)?terse:verbose); }


	return plugin;
}


