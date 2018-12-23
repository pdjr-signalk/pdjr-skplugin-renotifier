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
