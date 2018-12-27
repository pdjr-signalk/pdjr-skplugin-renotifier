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

A fresh 'out-of-the-box' installation of __signalk-renotifier__ implements just
the __null__ notification script which simply writes notification messages
into the system log file.

To get the plugin to actually distribute notifications it is necessary to add
one or more notification scripts which perform the required function.
Two such scripts, __email__ and __sms__, are provided with the plugin.

The __email__ script simply passes notification messages to the local mail
transfer agent.
If you have a working email system on the Signal K host, then this should
work out of the box.

The __sms__ script requires the presence of a cellular modem and the
section below explains how to configure this feature so that it is
available to the plugin. 

### Installing the email script

The __email__ script assumes that the host system has a configured and working
email system.
The script uses the  __mail__(1) program to pass a notification to the mail
transfer agent: in the unlikely event that this is not installed on your
system use your system's package manger to install the _mailutils_ package.

To install __signalk-renotifier__'s __email__ notification script, open a
terminal and enter the following commands:
```
$> cd ~/.signalk/node_modules/signalk-renotifier
$> make email
```
No further action is necessary.

You can use the command `make remove-email` to delete the __email__ script if
you no longer require it.

### Installing the sms script

#### Hardware

__signalk-renotifier__'s __sms__ script requires access to a cellular modem
connected to the Signal K Node server.
On most systems, the most straighforward way of achieving this is to install a
USB cellular modem and it is this approach that is discussed below.

The plugin has been tested with a Huawei E353 USB cellular modem (purchased on
Ebay for a few Euros) connected to a (probably unnecessary) external antenna
(purchased from a chandler for many tens of Euros).

Many, but not all, cellular modems are supported by __signalk-renotifier__'s
software stack.
Make sure that your modem is unlocked and that the SIM you intend to use has
passwords disabled (pop it in a phone to check and, if necessary, switch
password protection off).

#### Software

The software used by __signalk-renotier__ to access a cellular modem is
[Gammu](https://wammu.eu/gammu/).
This software is part of most modern Linux distributions and can be installed
using your system's package manager.
The __gammu__ documentation includes a list of supported modems and you should
check that your device is on the list - or, even better, check the list and
then acquire a supported device.

#### Configuration

After installing __gammu__ and connecting your USB modem, open a terminal and
install and configure the cellular modem interface by:

```
$> cd ~/.signalk/node_modules/signalk-renotifier
$> make sms
```
This command uses __gammu-detect__(1) to detect your modem and attempts to
generate the __gammu__ configuration file at `/etc/gammurc`.
Use the following command to check the result - the output should look
something like that displayed below.
```
$> gammu identify
Device               : /dev/ttyUSB0
Manufacturer         : Huawei
Model                : unknown (E353)
Firmware             : 11.810.09.40.156
IMEI                 : 868165002912360
SIM IMSI             : 204080515932553
```
If __gammu-identify__fails to generate output which reflects your connected
cellular modem, then consult the __gammu__ documentation to help diagnose
and correct the problem.

Once your modem is detected, you can confirm that it is able to send a text
message by substituting a suitable mobile phone number in the following
command:
```
$> cd ~/.signalk/node_modules/signalk-renotifier
$> echo "Test message" | ./script/sms 0123456789
```
Again, if this command fails, then use the __gammu__ documentation to help
diagnose and correct the problem.

Once you are confident that __gammu__ can detect your modem and reliably send
text messages, then you can proceed, firstly by making a decision on how you
would like __signalk-renotifier__ to interact with __gammu__.
There are two options:

1. Send SMS messages directly

In this case, the plugin uses a script to directly invoke __gammu__ each time
it needs to send a notification text.
This is the simplest solution for achieving SMS output, but has the
disadvantage of requiring exclusive access to the cellular modem and also not
scaling well if a number of SMS messages need to be sent at the same time.

2. Send SMS messages using a local messaging service

In this case, the plugin uses the __sms-gammusmsd__ script to inject messages
into the outbox of an executing SMS messaging daemon.
This is a more complex solution which requires the installation and
configuration of __gammu-smsd__(1) as a system service, but has the benefit of
scaling well and allowing the cellular modem to be used by programs other than
just __signalk-renotifier__.

Option 1 is configured by default and if you choose this then no further
action is required and you can revert to setting up __signalk-renotifier__ so
that it issues notifications using the __sms__ notification script.

Otherwise, continue to install an SMS messaging service and configure its use.

#### Installing and configuring gammu-smsd

The SMS messaging daemon, __gammu-smsd__ is distributed in most Linux variants
separately from __gammu__, so begin by using your system's package manager to
install the  _gammu-smsd_ package and any dependencies.

On most Linux distributions __gammu-smsd__ installation creates a 'gammu' user
and group and the directory `/var/spool/gammu/`.
What follows assumes these actions have taken place; if not, then you should
create the user, group and directory by hand.

Install and start the __gammu-smsd__ service by:
```
$> cd ~/.signalk/node_modules/signalk-renotifier
$> make smsd
```
You can check that the service is working by:
```
$> systemctl status gammu-smsd.service
```
If there seems to be a problem, then consult the system logs to identify what
has gone wrong and correct it.
You should now be able to confirm that the system can send a text message by
substituting a suitable mobile phone number in the following command:
```
$> cd ~/.signalk/node_modules/signalk-renotifier
$> echo "Test message" | ./script/sms 0123456789
```
Note that the text may not be sent immediately: the SMS messaging daemon tries
to process its outgoing queue as efficiently as possible and this means that
there may be up to a 30 second delay before the text message is actually sent.
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
