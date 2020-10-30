# signalk-renotifier

Execute external scripts in response to Signal K notification events.

This project implements a plugin for the
[Signal K Node server](https://github.com/SignalK/signalk-server-node).

Reading the [Alarm, alert and notification handling](http://signalk.org/specification/1.0.0/doc/notifications.html)
section of the Signal K documentation may provide helpful orientation.

__signalk-renotifier__ was developed to satisfy a requirement for
re-distribution of Signal K notifications over at least email and SMS.

The simplest way of achieving this was to provide a generic interface
to the host operating system's existing application suite: in
consequence the plugin's method of operation is unsophisticated and
boils down to "wait for some specified notification to appear and then
execute an external shell script".
The distribution includes two scripts which support distributing
notifications by email and SMS. 

Use this plugin with care: there are potentially no limits on what a
shell script can do... 

## System requirements

__signalk-renotifier__ has no special system requirements that must be
met prior to installation.

## Installation

Download and install __signalk-renotifier__ using the _Appstore_ link
in your Signal K Node server console.
The plugin can also be obtained from the 
[project homepage](https://github.com/preeve9534/signalk-renotifier)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).

### Scripts

A new installation of __signalk-renotifier__ includes three scripts:
_email_, _null_ and _sms_ which may provide an interface to services
on your system.
Or maybe not - perhaps you will have to tweak them to suit your
environment.
You can add additional scripts to the plugin by placing shell scripts
in the plugin's ```script/``` directory and restarting the Signal K
server.

The software and hardware installations required to support each of
the supplied scripts are discussed below.

### email 

This script uses __mail(1)__ to forward trigger notifications to
recipients.

If you already have an email system installed on your Signal K host
which allows you to send mail from the operating system command line,
then no further action should be necessary; if not, then you will need
to install some sort of email service to correct this deficiency.

If you don't have a permanent Internet connection, then one option is to
use a simple mail forwarder like
[ssmtp](https://wiki.archlinux.org/index.php/SSMTP)
to transfer outgoing email by SMTP to a well-connected remote mail
transfer agent like those offered by Gmail.
The __ssmtp__ documentation provides detailed instructions on how to
set this up.

### null

This script uses __logger(1)__ to write details of trigger
notifications into the system log file (useful for testing).

On most systems no further installation or configuration will be
required.

### sms  

This script uses __gammu-smsd-inject(1)__ to insert notification texts
into the outbox of a __gammu-smsd(1)__ service which is assumed to be
running on the host server.

[Gammu](https://wammu.eu/gammu/)
is part of most modern Linux distributions and can be installed using
your system's package manager.

For __gammu__ to operate it requires access to either a cellular modem
or a remotely operable cell-phone.
The __gammu__ documentation includes a list of supported devices and
comprehensive instructions on how to install and configure both
software and hardware.

The `gammu/` folder in the plugin installation directory includes some
material which _may_ help you install __gammu-smsd__. 

For my SMS connection I use a Siemens MC35i GPRS modem (purchased on
Ebay for a few Euros) connected to an external antenna (purchased from
a chandler for many tens of Euros).

## Usage

__signalk-renotifier__ is confugured through the Signal K Node server
plugin configuration interface.
Navigate to _Server->Plugin config_ and select the _Renotifier_ tab.

The _Active_ checkbox tells the Signal K Node server whether or not to
run the plugin: on first execution you should check this, before
reviewing and amending the configuration options discussed below.
Changes you make will only be saved and applied when you finally click
the _Submit_ button.

The plugin configuration pane has two sections: a list of notification
trigger paths and a list of notification scripts.

### Notification triggers  

Each entry in this list specifies a Signal K notification path which
may trigger execution of one or more notification script, defines the
scripts which will be executed and the conditions under which execution
will occur.
New entries can be created using the __[+]__ button and unwanted entries can
be deleted using the __[x]__ button.

Each notification trigger path is configured through the following
options. 
 
__Notification path__\
Specifies a Signal K notification path that should be monitored for
notification events.
Default is the empty string.
Enter a full notification path (wildcards are acceptable).
For example: "notifications.tanks.wasteWater.0".

__Trigger on these notification states__\
The notification states which should cause execution of the notifier
script(s).
The default value is to not trigger at all.
Check the notification states which should cause the notifier script to
execute when they appear on the specified trigger path.

__Use these notifiers__\
The notifier scripts which should be invoked when a notification
matching one of the chosen trigger states appears on the trigger path.
Note that if the plugin's `script/` directory contains no executable
scripts, then these checkboxes will be empty.
Default is to use no notification scripts.
Select the script or scripts you wish to use.

### Notification scripts

Each entry in the list shows an available script (i.e. one that exists
in the plugin's `script/` directory) and specifies the options and
arguments that are passed to the script when it is executed.

The available configuration options are described below.

__Name__\
The name of the notification script (i.e. the filename of the notifier
script in the plugin's `script/` directory).
This option cannot be changed.

__Description__\
A short description of the notification script (as reported by the
script when it is executed with no arguments).
This option cannot be changed.
If the script conforms to the plugin guidelines, then this text should
explain what sort of values the script will accept for the _Arguments_
option.

__Options__\
Options which will be passed to the script when it is executed.
Options are "Dry-run" (execute script but ask it not to perform its
substantive action) and "Log actions" (write a system log entry using
logger(1) to record the substantive actions that are being or would be
taken).

__Arguments__\
A comma or space separated list of values which should be passed to the
notifier script as arguments.
The default value is no arguments and the system will accept a maximum
of eight arguments.
The meaning of these values is script dependent (see _Description_
above), but for scripts which implement some kind of communication
these will likely indicate the recipient(s) of the notification.
For example, in the case of the `SMS` notifier script included in the
plugin distribution this option should contain a list of the cellphone
numbers to which notification texts should be sent.

## How do I write a notifier script

__signalk-renotifier__ passes information to a notifier script both as
command line parameters and as the scripts standard input.

The plugin scans its ```script/``` folder in order to generate the
entries that you see in the plugin's configuration page. For this to
work, you must ensure that when invoked with no command line parameters
your script issues some text that is appropriate for use in the
configuration page's notifier "Description" field.

When invoked with command line parameters, then the script is probably
going to actually do something. Each parameter is a value drawn from
the __Arguments__ field discussed above: do with it what you will.

Additionally, the script may be passed zero or more options.

The '-n' option indicates that your script should operate in "dry run"
mode - the idea is that it should do all that it would do in production,
but not actually do it.

The '-l' option indicates that your script should log its action to
the system logs (logger(1) might be useful here).

Finally, the script's standard input will receive five lines of text,
of the form "*token*__:__*stuff*":

| *token*   | *stuff* |
|:----------|:--------|
| VESSEL    | The vessel's name and MMSI. |
| STATE     | The triggering notification state (i.e. 'normal', 'warning', etc.). |
| METHOD    | The methods requested by the triggering notification. |
| MESSAGE   | The message text from the triggering notification. |
| TIMESTAMP | The timestamp from the triggering notification. |

## Debugging and logging

The plugin understands the following debug keys.

| Key                  | Meaning                                              |
|:---------------------|:-----------------------------------------------------|
| renotifier:\*        | Enable all keys.                                     |
| renotifier:triggers  | Log notification trigger paths loaded by the plugin. |
| renotifier:notifiers | Log notifier scripts accessible to the plugin.       |


## Author

Paul Reeve <preeve@pdjr.eu>\
October 2020
