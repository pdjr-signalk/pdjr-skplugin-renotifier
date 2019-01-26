# signalk-renotifier

[Signal K Node server](https://github.com/SignalK/signalk-server-node)
plugin which executes arbitrary external _notification scripts_ in response to
system notifications.

The plugin was developed to provide a remote notification service and although
this functional role determines the syntax of external script invocation it
does not place arbitrary constraints on what a script can do.

This distribution includes scripts which support distributing notifications by
email and SMS. 
## System requirements

__signalk-renotifier__ has no special system requirements that must be met
prior to installation.

Since this plugin's purpose is simply to distribute Signal K notifications, the
Signal K server must be issuing notifications relating to the values you wish
to monitor.
There are a number of general purpose notification plugins available in the
Signal K appstore which may satisfy this requirement. 
## Installation

Download and install __signalk-renotifier__ using the _Appstore_ link in your
Signal K Node server console.
The plugin can also be obtained from the 
[project homepage](https://github.com/preeve9534/signalk-renotifier)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).

A fresh 'out-of-the-box' installation of __signalk-renotifier__ includes three
notification scripts: _email_, _null_ and _sms_.
The software and hardware installations required to support each of these are
discussed below.

### email 
This script uses __mail(1)__ to forward trigger notifications to recipients.

If you already have an email system installed on your Signal K host which
allows you to send mail from the operating system command line, then no
further action should be necessary; if not, then you will need to install
some sort of email service to correct this deficiency.

If you don't have a permanent Internet connection, the one option is to use a
simple mail forwarder like
[ssmtp](https://wiki.archlinux.org/index.php/SSMTP)
to transfer outgoing email by SMTP to a well-connected remote mail transfer
agent like those offered by Gmail.
The __ssmtp__ documentation provides detailed instructions on how to set this
up.

### null
This script uses __logger(1)__ to write details of trigger notifications into
the system log file (useful for testing).

On most systems no further installation or configuration will be required.

### sms  
This script uses __gammu-smsd-inject(1)__ to insert notification texts into
the outbox of a __gammu-smsd(1)__ service which is assumed to be running on
the host server.

[Gammu](https://wammu.eu/gammu/) is part of most modern Linux distributions
and can be installed using your system's package manager.

For __gammu__ to operate it requires access to either a cellular modem or
a remotely operable cell-phone.
The __gammu__ documentation includes a list of supported devices and
comprehensive instructions on how to install and configure both software
and hardware.

The `gammu/` folder in the plugin installation directory includes some
material which _may_ help you install __gammu-smsd__. 

For my SMS connection I use a Huawei E353 USB cellular modem (purchased on
Ebay for a few Euros) connected to a (probably unnecessary) external antenna
(purchased from a chandler for many tens of Euros).
## Usage

__signalk-renotifier__ is confugured through the Signal K Node server plugin
configuration interface.
Navigate to _Server->Plugin config_ and select the _Renotifier_ tab.

![Plugin configuration screen](readme/screenshot.png)

The _Active_ checkbox tells the Signal K Node server whether or not to run the
plugin: on first execution you should check this, before reviewing and
amending the configuration options discussed below.
Changes you make will only be saved and applied when you finally click the
_Submit_ button.

The plugin configuration pane has two sections:  a list of notification
trigger paths and a (normally closed) list of notification scripts.

### Notification trigger paths  

Each entry in this list specifies a Signal K notification path which may
trigger execution of one or more notification script, defines the scripts
which will be executed and the conditions under which execution will occur.
New entries can be created using the __[+]__ button and unwanted entries can
be deleted using the __[x]__ button.

On first execution of __signalk-renotifier__ this list will normally contain
a single, blank, entry which should be completed.

Each notification trigger path is configured through the following options. 
 
__Notification trigger path__  
This required option specifies the monitored Signal K notification path.
Default is the empty string.
Supply a notification path, omitting the 'notifications' prefix.
Wildcards are acceptable: for example, you could use 'tanks.\*' to monitor all
notifications related to tank storage.

__Trigger on these notification states__  
The notification states which should cause execution of the notifier script.
The default value is to not trigger at all.
Check the notification alarm states which should cause the notifier script
to execute should they appear on the specified trigger path.

__Use these notifiers__  
The notifier scripts which should be invoked when notification matching one of
the chosen trigger states appears on the trigger path (if the plugin's
`script/` directory contains no executable scripts, then this list will be
empty).
Default is to use no notification scripts.
Select the script or scripts you wish to use.

### Notification scripts

This list is closed by default, click on the tab to open it.

Each entry in the list shows an available script (i.e. one that exists in the
plugin's `script/` directory) and specifies the options and arguments that
are passed to the script when it is executed.

The available configuration options are described below.

__Name__  
The name of the notification script (i.e. the filename of the notifier script
in the plugin's `script/` directory).
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
