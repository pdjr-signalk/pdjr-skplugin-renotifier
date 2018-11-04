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
				notifiers: {
					title: "Notifiers",
					type: "array",
					default: [],
					items: {
						type: "object",
						properties: {
							active: {
								title: "Active",
								type: "boolean",
								default: false
							},
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
							triggers: {
								title: "Triggered by",
								type: "string",
								default: "alert",
								enum: [ "normal", "alert", "alarm", "emergency" ]
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
		notifiers: {
			"ui:options": {
				addable: false,
				orderable: false
			},
			items: {
				name: {
					"ui:disabled": true
				}
			}
		}
	}

	plugin.start = function(options) {

		try {
			var updatedOptions = updateOptions(options);
			if (updatedOptions !== undefined) {
				try {
					options = updatedOptions;
					app.savePluginOptions(options);
					logN("notifiers changed on disk (" + options.notifiers.map(v => v['name']).join(',') + ")");
				} catch(e) {
					logE("cannot save options");
					return;
				}
			}
		} catch(e) {
			logE(e);
			return;
		}
		logN("Notifying by " + options.notifiers.filter(v => v['active']).map(v => v['name']).join(','));

/*
		if (fs.existsSync(RRDPATHNAME)) {

			var streams = options.sensors.map(v => app.streambundle.getSelfBus(v['path']));

			logN("connected to " + streams.length + " sensor streams");

			unsubscribes.push(bacon.zipAsArray(streams).debounceImmediate(1000 * UPDATE_INTERVAL).onValue(function(v) {
				var now = Math.floor(Date.now() / 60000);

				updateDatabase(
					RRDTOOL,
					RRDPATHNAME,
					v.map(a => makeIdFromPath(a['path'])),
					v.map(a => (Math.round(a['value'] * 100))),
					options.consolereporting?app.setProviderStatus:null,
					logW
				);

				if (GRAPHDIR.length != 0) {
					[ 'day','week','month','year' ].filter((v,i) => ((now % GRAPH_INTERVALS[i]) == 0)).forEach(
						period => createGraph(RRDPATHNAME, GRAPHDIR, options.sensors, period, null, logW)
					);
				}
			}));
		} else {
			logE("database missing");
			return;
		}
*/

	}

	plugin.stop = function() {
		unsubscribes.forEach(f => f());
		unsubscribes = [];
	}

	function updateOptions(options) {
		var changed = false;

		try {
			var entries = fs.readdirSync(NOTIFIER_DIRECTORY);
			// Delete dead ones...
			var n = options.notifiers.length;
			options.notifiers = options.notifiers.filter(v => entries.includes(v['name']));
			changed = (options.notifiers.length != n);
			// Add new ones...
			entries.forEach(function(entry) {
				if (!options.notifiers.map(v => v['name']).includes(entry)) {
					var description = "";
					try { description = execSync(NOTIFIER_DIRECTORY + entry).toString().trim(); } catch(err) {  }
					options.notifiers.push({
						"active": false,
						"name": entry,
						"description": description,
						"triggers": "alert",
						"arguments": ""
					});
					changed = true;
				}
			});
		} catch(e) {
			logE("error reading script directory");
			throw("error reading script directory");
		}
		return(changed?options:undefined);
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


