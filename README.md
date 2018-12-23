# signalk-renotifier

[Signal K Node server](https://github.com/SignalK/signalk-server-node)
plugin which executes arbitrary external scripts in response to system
notifications.

The plugin was developed to provide a remote notification service and although
this functional role determines the syntax of external script invocation it
does not place arbitrary constraints on what a script can do.

This documentation includes a case study of using __signalk-renotifier__ to
implement a simple SMS-based notification service on the author's ship
_Beatrice_.
## System requirements

__signalk-renotifier__ has no special system requirements that must be met
prior to installation.

For the plugin to operate notifications must be being raised on the host
Signal K server: there are a number of notification plugins available in the
Signal K appstore. 

Of course, for the plugin to actually _do_ anything it requires one or more
scripts which implement the actual renotification function.
Two such specimen scripts are included with the distribution which provide
cellular network messaging and email connectivity.
Both of these have their own requirements for supporting hardware and
infrastructure.
## Installation

Download and install __signalk-renotifier__ using the _Appstore_ link in your
Signal K Node server console.
The plugin can also be obtained from the 
[project homepage](https://github.com/preeve9534/signalk-renotifier)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).
## Usage

__signalk-renotifier__ is confugured through the Signal K Node server plugin
configuration interface.
Navigate to _Server->Plugin config_ and select the _Renotifier_ tab.

![Plugin configuration screen](readme/screenshot.png)

The _Active_ checkbox tells the Signal K Node server whether or not to run the
plugin: on first execution you should check this option, then review and amend
the configuration options discussed below before clicking the _Submit_ button
to save any changes and start the plugin.

The plugin configuration pane has two sections:  a list of notification
trigger paths and a (normally closed) list of notification scripts.

### Notification trigger paths  

Each entry in this list specifies a Signal K notification path which may be
used to trigger a notification script, defining the scripts which will be
executed and the conditions under which execution will occur.
New entries can be created using the __[+]__ button and unwanted entries can
be deleted using the __[x]__ button.

On first execution of __signalk-renotifier__ this list will normally contain
a single, blank, entry which should be completed.
If the plugin `scripts/` directory contains no executable scripts, then this
list will be empty.

Each notification trigger path is configured through the following options. 
 
__Notification trigger path__  
This required option specifies the monitored Signal K notification path.
Default is the empty string.
Supply a notification path, omitting the 'notifications' prefix.
Wildcards are acceptable: for example, you could use 'tanks.\*' to monitor all
notification related to tank storage.

__Trigger on these notification states__  
The notification states which should cause execution of the notifier script.
The default value is to not trigger at all.
Check the notification alarm states which should cause the notifier script
to execute should they appear on the specified trigger path.

__Use these notifiers__  
The notifier scripts which should be invoked when notification matching one of
the chosen trigger states appears on the trigger path.
Default is to use the `null` notification script.
Select the script or scripts you wish to use.

### Notification scripts

This list is closed by default, click on the tab to open it.

Each entry in the list shows an available script (i.e. one that exists in the
plugin's `scripts/` directory) and specifies the options and arguments that
are passed to the script when it is executed.

The available configuration options are described below.

__Name__  
The name of the notification script (i.e. the filename of the notifier script
in the plugin's `scripts/` directory).
This option cannot be changed.

__Description__  
A short description of the notification script (as reported by the script when
it is executed with no arguments).
This option cannot be changed.
If the script conforms to the plugin guidelines, then this text should explain
what sort of values the script will accept for the _Arguments_ option.

__Options__  
Options which will be passed to the script when it is executed.
Options are "Dry-run" (execute script but ask it not to perform its
substantive action) and "Log actions" (write a system log entry using logger(1)
to record the substantive actions that are being or would be taken).

__Arguments__  
A comma or space separated list of values which should be passed to the notifier
script as arguments.
The default value is no arguments and the system will accept a maximum of
eight arguments.
The meaning of these values is script dependent (see _Description_ above),
but for scripts which implement some kind of communication these will likely
indicate the recipient(s) of the notification.
For example, in the case of the `SMS` notifier script included in the plugin
distribution this option should contain a list of the cellphone numbers
to which notification texts should be sent.
