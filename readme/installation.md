## Installation

Download and install __signalk-renotifier__ using the _Appstore_ link in your
Signal K Node server console.
The plugin can also be obtained from the 
[project homepage](https://github.com/preeve9534/signalk-renotifier)
and installed using
[these instructions](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md).

A fresh 'out-of-the-box' instalationl of __signalk-renotifier__ supports just
the __null__ notification script which simply writes notification messages
into the system log file.
To get the plugin to do anything else it is necessary to add a purposed
notification script.
Two such scripts are provided with the installation: __email__ and __sms__.
The __email__ script requires a isignificant supporting infrastructure which
may not be commonly available and it is not discussed further.
The __sms__ script requires just the presence of just a cellular modem and the
following section explains how to configure this feature so that it is
available to the plugin. 
