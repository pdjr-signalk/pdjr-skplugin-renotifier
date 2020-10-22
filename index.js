/**********************************************************************
 * Copyright 2018 Paul Reeve <preeve@pdjr.eu>
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you
 * may not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

const { spawn } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const bacon = require('baconjs');
const Schema = require("./lib/signalk-libschema/Schema.js");
const Log = require("./lib/signalk-liblog/Log.js");
const DebugLog = require("./lib/signalk-liblog/DebugLog.js");

const PLUGIN_SCHEMA_FILE = __dirname + "/schema.json";
const PLUGIN_UISCHEMA_FILE = __dirname + "/uischema.json";
const PLUGIN_SCRIPT_DIRECTORY = __dirname + "/script";
const DEBUG_TOKENS = [ "triggers", "notifiers" ];

module.exports = function(app) {
  var plugin = {};
  var unsubscribes = [];

  plugin.id = "renotifier";
  plugin.name = "Renotifier";
  plugin.description = "Execute external scripts in response to Signal K notification events.";

  const log = new Log(plugin.id, { ncallback: app.setPluginStatus, ecallback: app.setPluginError });
  const debug = new DebugLog(plugin.id, DEBUG_TOKENS);
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
    debug.N("*", "available debug tokens: %s", debug.getKeys().join(", "));

    // Check the script files available on disk and update options to
    // reflect any changes.
    //
    options.notifiers = loadNotifiers(PLUGIN_SCRIPT_DIRECTORY, options.notifiers);
    options.triggers.forEach(trigger => {
      trigger.notifiers = trigger.notifiers.filter(nf => options.notifiers.map(v => v.name).includes(nf));
    });
    app.savePluginOptions(options, function(err) { if (err) log.E("update of plugin options failed: " + err); });
    options.notifiers.forEach(notifier => debug.N("notifiers", "loading notifier %o", notifier));

    // Start production by subscribing to the Signal K paths that are
	// identifed in the configuration options.  Each time a notification
	// appears on one of these streams, then offer it for action to each
	// of the active notifier scripts.
	//
    var streams = options.triggers.reduce((a, trigger) => {
      var stream = null;
      trigger.path = (trigger.path || "").trim();
      trigger.conditions = trigger.conditions || [];
      trigger.notifiers = trigger.notifiers || [];
      debug.N("triggers", "loading trigger %o", trigger);
      if (trigger.path != "") {
        if (trigger.conditions.length > 0) { 
          if (trigger.notifiers.length > 0) { 
            if (stream = app.streambundle.getSelfBus(trigger.path)) {
              a.push(stream);
            } else { log.E("could not create stream for trigger %o", trigger); }
          } else { log.W("ignoring trigger with no notifiers (%o)", trigger); }
        } else { log.W("ignoring trigger with no conditions (%o)", trigger); }
      } else { log.E("discarding trigger with no path (%o)", trigger); }
      return(a);
    }, []);

    if (streams.length > 0) {
      log.N("monitoring " + streams.length + " notification stream" + ((streams.length == 1)?"":"s"));
      unsubscribes.push(bacon.mergeAll(streams).onValue(notification => {
        if (notification.value != null) {
          var conditions = options.triggers.reduce((a,trigger) => ((trigger.path == notification.path)?trigger.conditions:a), []);
          var notifiers = options.triggers.reduce((a,trigger) => ((trigger.path == notification.path)?trigger.notifiers:a), []);
          if (conditions.includes(notification.value.state)) {
            options.notifiers.filter(notifier => (notifiers.includes(notifier.name))).forEach(notifier => {
              try {
                debug.N("triggers", "executing notification script %s", command);
	            var command = PLUGIN_SCRIPT_DIRECTORY + "/" + notifier['name'];
                var options = notifier['options'];
                var args = notifier['arguments'];
                performNotification(command, options, args, notification.value); 
              } catch(e) {
                log.E("failed to execute notification script %s", command);
              }
            });
          }
        }
      }));
    } else {
      log.N("there are no viable trigger streams");
	}
  }

  plugin.stop = function() {
    unsubscribes.forEach(f => f());
    unsubscribes = [];
  }

  /********************************************************************
   * Executes <command> in a separate shell.
   */

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

  /********************************************************************
   * Constructs and returns an array of notifier definitions by
   * reconciling the contents of <directory> with the list of notifier
   * definitions passed in <notifiers>. The supplied and returned
   * definition lists have exacyly the same structure as the "notifiers"
   * property in the plugin configuration file.
   *
   * Each file in <directory> is assumed to be a notifier script: if a
   * script is represented by an entry in <notifiers>, then the entry
   * is retained; if a script is not represented in <notifiers>, then
   * a new entry describing the script is created; is an entry exists
   * in <notifiers> but there is no corresponding script, then the
   * entry is deleted. The reconciled <notifications> list is returned.
   */
 
  function loadNotifiers(directory, notifiers = []) {
    var retval = [];
    try {
      retval = fs.readdirSync(directory).map(entry => {
        var description = "";
        try {
          description = execSync(directory + "/" + entry).toString().trim();
          var notifier = (notifiers !== undefined)?(notifiers.reduce((a,v) => ((v['name'] == entry)?v:a), null)):null;
          return((notifier != null)?notifier:{ "name": entry, "description": description, "arguments": "", "options": [] });
        } catch(err) { }
      });
    } catch(err) { }
    return(retval);
  }

  return plugin;
}


