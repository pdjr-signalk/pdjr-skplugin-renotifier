# signalk-renotifier

[Signal K Node server](https://github.com/SignalK/signalk-server-node)
plugin which executes a script in response to system notifications.
The plugin installation discusses examples of using the plugin to distribute
SMS and email alerts.

Signal K notifications are processed by __signalk-renotifier__ and trigger
calls to one or more external scripts which implement some desired action.
The plugin ships with simple scripts for sending SMS and email messages, but
the actual external action is not constrained and the user can supply their
own additional scripts to implement a required function. 

The _System requirements_ section below discusses some of the issues around
supporting SMS and Email communications and summarises the way in which these
have been addressed in plugin development environment.

The remaining part of this document focusses almost exclusively on the
provison of SMS based notification using a cellular modem connected directly
to the Signal K Node server host.

## Principle of operation

__signalk-renotifier__ is configured with a collection of Signal K
notification paths called _trigger paths_ and a collection of notification
scripts called _notifiers_.

When the Signal K Node server receives a notification update relating to one
of the trigger paths the plugin presents a notification opportunity to each
notifier.
Each notifier is configured with a set of _trigger states_ to which it should
respond and if the state of the received notification update matches one of
the configured trigger states then the notifier's external script  will be
invoked.
 
## System requirements

__signalk-renotifier__ has no special system requirements that must be met
prior to installation.

System requirements are contingent upon the specific needs of each of the
external _notifier scripts_ that the plugin executes.
The plugin ships with two example scripts for sending SMS texts and emails and
the requirements of each of these are discussed below.

### SMS - send notifications by SMS text

To be able to send SMS messages a computer must have access to a cellular
modem or a mobile phone that supports remote control and a software stack that
can make the hardware operate in a meaningful way.

Hardware.
Cellular modem USB dongles are inexpensive and moderately well supported by
the popular Linux distributions: my Signal K Node server has a permananently
attached Huawei E353 cellular modem (purchased on Ebay for a few Euros)
connected to a (probably unnecessary) external antenna (purchased from a
chandler for many tens of Euros).

Software.
[Gammu](https://wammu.eu/gammu/)
is a software suite for operating most types of cellphone hardware and is
part of most Linux distributions.
_Gammu_ has out-of-the-box support for the Huawei E353 (but not for all
USB cellular modems...).

### Email - send notifications by electronic mail

For the plugin to be able to send email the host system must have a working
mail transfer agent (MTA) and a supporting mechanism for permanent or on-demand
connection to the Internet.
It is relatively straightforwards, but non-trivial to implement an email
infrastructure for a boat that can sensibly support __signalk-renotifier__.
My solution (summarised below) is home-spun, but there are out-of-box
alternatives built upon a range of communication technologies available from
commercial suppliers.

Hardware and infastructure.
My ship-wide ethernet includes an inexpensive 4G wireless router configured to
provide on-demand Internet connectivity over WiFi, automatically falling back
onto the cellular network when WiFi is not available.
This means that any demand from a device on the ship's LAN for access to the
Internet (including for the purpose of sending email) is automatically
satisfied.

Software.
[Sendmail](https://en.wikipedia.org/wiki/Sendmail)
is used as the Signal K Node server host's mail transfer agent (MTA), routing
outgoing email directly to Google's Gmail SMTP servers.
_Sendmail_ is part of most Linux distributions and its configuration and use
are comprehensively documented.

## Installation

1. If you don't have it already, install __gammu__ on your Signal K Node
server host.
Use your system's package manager, or download and install a suitable version
from the
[gammu download page](https://wammu.eu/download/gammu/).

2. Download and install __signalk-renotifier__ using the _Appstore_ link
in your Signal K server console.
The plugin can also be downloaded from the 
[project homepage](https://github.com/preeve9534/signalk-renotifier)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).

## Usage

### Activating the plugin

### Customising plugin operation

The plugin configuration page at _Server->Plugin config->Renotifier_ offers
the following configuration options.

__Rescan script directory__.  Checkbox requesting that the list of _Notifiers_
(see below) be re-built by scanning the plugin's `bin/` folder for
executable scripts.
Default is true (to cause the _Notifiers_ list to built on first execution),
but the value is set false after a scan is completed.

__Trigger paths__.  A collection of potential Signal K notification paths 
which are of interest to the plugin.
Default is the empty string.
Enter here a list of whitespace separated (newline works best) Signal K paths,
without the 'notifications.' prefix.
For example, if notifications are being raised in the system when the level of
waste in the black water tank exceeds some threshold, then entering a string
of the form "tanks.wasteWater.0.currentLevel" will cause the plugin to look
out for notifications on this data point.
 
__Notifiers__.  A list of notifier scripts and their options.
Default is the list of all notifier scripts in the `bin/` folder in the
plugin's installation directory.
Entries in the list can be deleted and the list can be re-built (by re-scanning
the `bin/` folder) using the _Rescan script directory_ option described above.
Each notifier in the list can be configured through the following options.

__Name__.  The name of the notifier (actually the filename of the notifier
script in the plugin's `bin/` directory).
This option cannot be changed.

__Description__.  A short description of the notifier (as reported by the
notifier script when run with no arguments).
This option cannot be changed and should explain what values the notifier
script will accept for the _Arguments_ option (see below).

__Triggered states__.  The types of notification events which should cause
execution of the notifier script.
The default value is to not trigger at all.
Check the notification states which should cause the notifier script to
execute when a notification appears on one of the _Trigger paths_.
Use the dropdown list to select the required triggers.

__Arguments__.  A comma or space separated list of values which should be
passed to the notifier script as arguments.
The default value is no arguments.
The meaning of these values is script dependent (see _Description_ above),
but for scripts which implement some kind of communication these will likely
indicate the recipient(s) of the notification.
For example, in the case of the `SMS` notifier script included in the plugin
distribution this option should include a list of the cellphone numbers
to which notification texts should be sent.

### Notifier scripts

Notifier scripts are shell scripts or executables located in the `bin/`
folder under the plugin installation directory.
Scripts must be executable by the owner of the executing Signale K Node server.

__signalk-renotifier__ executes a script by passing the text of the
notification as the script's standard input and the contents of the
configuration _Arguments_ field as the script argument(s).
For a script designed to send messages, the _Arguments_ field will typically
contain a list of message addressees in whatever format suits the mode
of communication: telephone numbers for SMS, email addresses for email,
and so on.

The plugin executes each notifier script once with no arguments and uses
the return value as the contents of the _Description_ configuration option.

The `SMS` script installed with the plugin is listed below.

```
#!/bin/bash
# Send Signal K notifications by SMS

# Issue some text for use in the plugin configuration 'Description' option
if [ "$#" -eq 0 ]; then
	echo "Send Signal K notifications by SMS (arguments must be phone numbers)"
	exit 0
fi
 
GAMMU="/usr/bin/gammu"

while [ "${1}" != "" ]; do
#	COMMAND="$GAMMU sendsms TEXT ${1}"
#	eval ${COMMAND} < &0
#	shift
done
```

## Notifications, warnings and errors

## License

__signalk-renotifier__ is released under Apache License 2.0.
