usage:
	@echo "make ( install-smsd | uninstall )"

install-smsd:
	/bin/cp system/gammu-smsd.service /etc/systemd/system
	/bin/systemctl daemon-reload
	/bin/systemctl enable gammu-smsd.service
	/bin/systemctl start gammu-smsd.service

uninstall:
	/bin/systemctl stop gammu-smsd.service 
	/bin/systemctl disable gammu-smsd.service 
	/bin/rm -f /etc/systemd/system/gammu-smsd.service
	/bin/systemctl daemon-reload
