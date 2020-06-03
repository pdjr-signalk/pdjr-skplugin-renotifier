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
const Schema = require("./lib/signalk-libschema/Schema.js");
const Log = require("./lib/signalk-liblog/Log.js");

const PLUGIN_SCHEMA_FILE = __dirname + "/schema.json";
const PLUGIN_UISCHEMA_FILE = __dirname + "/uischema.json";
const PLUGIN_SCRIPT_DIRECTORY = __dirname + "/script";
const DEBUG = false;

module.exports = function(app) {
	var plugin = {};
	var unsubscribes = [];

	plugin.id = "renotifier";
	plugin.name = "Renotifier";
	plugin.description = "Take external action on a Signal K notification";

    const log = new Log(plugin.id, { ncallback: app.setProviderStatus, ecallback: app.setProviderError });
    const VESSEL_NAME = app.getSelfPath("name") || "Unnamed Vessel";
    const VESSEL_MMSI = app.getSelfPath("mmsi") || "--";

    /**
     * Load plugin schema from disk file and add a default list of notifiers
     * garnered from the plugin script directory.  The names of these
     * notifiers are saved so that they can be added as checkbox options to
     * subsequently identified notification paths.
     */
	plugin.schema = function() {
        var schema = Schema.createSchema(PLUGIN_SCHEMA_FILE);
        var notifiers = loadNotifiers(PLUGIN_SCRIPT_DIRECTORY);
        schema.insertValue("properties.notifiers.default", notifiers);
        schema.insertValue("properties.triggers.items.properties.notifiers.items.enum", notifiers.map(notifier => notifier["name"]));
        return(schema.getSchema());
    };
 
	plugin.uiSchema = function() {
        var schema = Schema.createSchema(PLUGIN_UISCHEMA_FILE);
        return(schema.getSchema());
    }

	plugin.start = function(options) {
        // Check the script files available on disk and update options to
        // reflect any changes.
        //
        options.notifiers = loadNotifiers(PLUGIN_SCRIPT_DIRECTORY, options.notifiers);
        options.triggers.forEach(trigger => {
            trigger.notifiers = trigger.notifiers.filter(nf => options.notifiers.map(v => v.name).includes(nf));
        });
        app.savePluginOptions(options, function(err) { if (err) log.W("update of plugin options failed: " + err); });

		// Start production by subscribing to the Signal K paths that are
		// identifed in the configuration options.  Each time a notification
		// appears on one of these streams, then offer it for action to each
		// of the active notifier scripts.
		//
		try {
			var streams = options.triggers.filter(trigger => (trigger.conditions.length > 0)).map(trigger => app.streambundle.getSelfBus(trigger.path));
			if (streams.length > 0) {
				log.N("monitoring " + streams.length + " notification stream" + ((streams.length == 1)?"":"s"));
				unsubscribes.push(bacon.mergeAll(streams).onValue(notification => {
                    if (notification.value != null) {
                        var conditions = options.triggers.reduce((a,trigger) => ((trigger.path == notification.path)?trigger.conditions:a), []);
                        var notifiers = options.triggers.reduce((a,trigger) => ((trigger.path == notification.path)?trigger.notifiers:a), []);
                        if (conditions.includes(notification.value.state)) {
                            options.notifiers.filter(notifier => (notifiers.includes(notifier.name))).forEach(notifier => {
				                var command = PLUGIN_SCRIPT_DIRECTORY + "/" + notifier['name'];
						        var options = notifier['options'];
                                var args = notifier['arguments'];
                                performNotification(command, options, args, notification.value); 
                            });
                        }
                    }
				}));
			} else {
                log.E("there are no viable trigger streams");
                return;
            }
		} catch(e) {
			log.E("Failed " + e);
			return;
		}
	}

	plugin.stop = function() {
		unsubscribes.forEach(f => f());
		unsubscribes = [];
	}

    function performNotification(command, options, args, notification) {
	    var retval = null, exitcode = 0, stdout = "", stderr = "";
        var argarr = (options || []).concat((args !== undefined)?args.split(/[ ,]+/):[]);
	    var child = spawn(command, argarr, { shell: true, env: process.env });
        if (child != null) {
	        child.stdout.on('data', (data) => { stdout+=data; });
	        child.stderr.on('data', (data) => { stderr+=data; });
            child.stdin.write("VESSEL:" +  VESSEL_NAME + " (" + VESSEL_MMSI + ")\n");
            child.stdin.write("STATE:" + notification.state + "\n");
            child.stdin.write("METHOD:" + notification.method.join(" ") + "\n");
		    child.stdin.write("MESSAGE:" + notification.message + "\n");
            child.stdin.write("TIMESTAMP:" + notification.timestamp + "\n");
            child.stdin.end();
		    child.on('close', (code) => { log.N("Notified: "); });
		    child.on('error', (code) => { log.E("Failed"); });
        }
    }

	function loadNotifiers(directory, notifiers) {
        if (DEBUG) console.log("loadNotifiers('" + directory + "', " + JSON.stringify(notifiers) + ")...");
		var retval = [];

		try {
			retval = fs.readdirSync(directory).map(entry => {
				var description = "";
                try {
                    description = execSync(directory + "/" + entry).toString().trim();
				    var notifier = (notifiers !== undefined)?(notifiers.reduce((a,v) => ((v['name'] == entry)?v:a), null)):null;
				    return((notifier != null)?notifier:{"name": entry,"description": description,"arguments": "","triggerstates": [],"options": [] });
                } catch(err) { }
            });
		} catch(err) { }
		return(retval);
	}

	return plugin;
}


