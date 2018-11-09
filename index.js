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

const { spawn } = require('child_process');
const { execSync } = require('child_process');
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
					default: false
				},
				paths: {
					title: "Trigger paths",
					description: "Enter one or more whitespace separated notification paths",
					type: "string",
					default: ""
				},
				notifiers: {
					title: "Notifiers",
					type: "array",
					default: loadNotifiers([]),
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

		// If the scan option is true, then we need to rebuild the list of
		// notifier scripts by loading entries from the plugin's bin/ folder
		// and saving them to the plugin options.
		//
		if (options.scan) {
			try {
				var updatednotifiers = loadNotifiers(options.notifiers);
				options.notifiers = updatednotifiers;
				options.scan = false;
				try {
					app.savePluginOptions(options);
					logN("plugin notifier list updated from disk");
				} catch(e) {
					logE("cannot save configuration options: " + e);
					return;
				}
			} catch(e) {
				logE("cannot scan script directory: " + e);
				return;
			}
		}


		// Start production by subscribing to the Signal K paths that are
		// identifed in the configuration options.  Each time a notification
		// appears on one of these streams, then offer it for action to each
		// of the active notifier scripts.
		//
		try {
			var streams = (options.paths.match(/\S+/g).map(p => app.streambundle.getSelfBus("notifications." + p))) || [];
			if (streams.length > 0) {
				logN("connected to " + streams.length + " notification stream" + ((streams.length == 1)?"":"s"));
				unsubscribes.push(bacon.mergeAll(streams).onValue(function(v) {
					options.notifiers.filter(n => (n['triggerstates'].includes(v['value']['state']) && (n['arguments'] != ""))).forEach(function(notifier) {
						var command = __dirname + "/bin/" + notifier['name'];
						var args = sanitizeArguments(notifier['arguments']);
						var exitcode = 0, stdout = "", stderr = "";
						var child = spawn(command, args, { shell: true, env: process.env });
						child.stdout.on('data', (data) => { stdout+=data; });
						child.stderr.on('data', (data) => { stderr+=data; });
						child.stdin.write(v['value']['message']); child.stdin.end();
						child.on('close', (code) => { logE("Complete " + stdout + stderr); });
						child.on('error', (code) => { logE("Failed" + stdout + stderr); });
					});
				}));
			}
		} catch(e) {
			logE("Failed " + e);
			return;
		}
	}

	plugin.stop = function() {
		unsubscribes.forEach(f => f());
		unsubscribes = [];
	}

	/**
	 * Convert args into an array of strings
	 */
	function sanitizeArguments(args) {
		return((args !== undefined)?args.split(/[ ,]+/):[]);
	}

	function loadNotifiers(notifieroptions) {
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


