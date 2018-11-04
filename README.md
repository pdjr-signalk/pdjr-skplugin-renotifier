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

## System requirements

__signalk-renotifier__ has no special system requirements that must be met
prior to installation.

System requirements are contingent upon the specific needs of each of the
external _notifier scripts_ that the plugin executes.
The plugin ships with two example scripts for sending SMS texts and emails and
the requirements of each of these are discussed below.

### `bin/SMS` send notifications by SMS

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

### `bin/Email`

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

The plugin configuration page at _Server->Plugin config->Renotifier_ lists each
identified notifier and offers the following configuration options:

__Active__.  Enables or disables this notifier.
Default value is disabled.
Check this option to enable the notifier.

__Name__.  The name of the notifier (actually the filename of the notifier
script in the plugin's `bin/` directory).
This option cannot be changed.

__Description__.  A short description of the notifier (as reported by the
notifier script when run with no arguments).
This option cannot be changed and should explain what values the notifier
script will accept for the _Arguments_ option (see below).

__Triggered by__.  The types of notification events which should cause
execution of the notifier script.
The default value triggers an alert on any of _alert_, _alarm_ and _emergency_.
Use the dropdown list to select the required triggers.

__Arguments__.  A comma or space separated list of values which should be
passed to the notifier script as arguments.
The meaning of these values is script dependent, but for scripts which
implement some kind of communication it is sensible if these indicate the
recipient of the notification.
For example, in the case of the `SMS` notifier script included in the plugin
distribution this option should include a list of the cellphone numbers of
to which notification texts should be sent.

## Notifications, warnings and errors

## License

__signalk-renotifier__ is released under Apache License 2.0.
