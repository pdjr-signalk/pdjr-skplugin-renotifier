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
