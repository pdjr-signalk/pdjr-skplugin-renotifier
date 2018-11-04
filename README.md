# signalk-renotifier

[Signal K Node server](https://github.com/SignalK/signalk-server-node)
plugin to issue notifications through user-defined external channels.

Signal K notifications are processed by __signalk-renotifier__ and trigger
calls to one or more external scripts which implement some desired action.
The plugin ships with scripts suitable for sending SMS and email messages,
but the actual external action is not constrained: be aware that this may
present a security issue in improperly installed, configured and managed
environments. 

## System requirements

Essentially there are none other than the necessity to provide one or more
scripts which implement the actions you require when a notification is to be
issued.

The plugin ships with two such notifier scripts: `bin/email` sends email
messages advising nominated recipients of the triggering notification; and
`bin/SMS` which sends notifications as text messages over the cellular network.

Of course, this is only half a story.
For the plugin to be able to send email the host system must have a working
mail transfer agent (MTA) and to be able to send SMSs the host must have
access to a cellular modem.

The plugin was developed and tested in an environment using the
[sendmail]()
MTA on a network where a router provides on-demand Internet connectivity over
WiFi (failing back onto cellular broadband) with Google mail as the mail
gateway and it is this type of infrastructure which is expected by the
`bin/email` script.
It may be non-trivial to implement an email infrastructure that can sensibly
support __signalk-renotifier__. 

The plugin development host has a permanently attached 3G/4G USB dongle
supported by
[gammu]()
and it is this architecture which is expected by the `bin/SMS` script.
It is trivial to implement a 3G/4G dongle-based communication system using
`gammu` in most current Linux distributions.

## Installation

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
This option cannot be changed.

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
