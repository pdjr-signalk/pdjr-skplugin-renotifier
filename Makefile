SMS_DIRECTORIES = gammu sms
SMSD_DIRECTORIES = gammu sms systemd
ALL_DIRECTORIES = $(SMSD_DIRECTORIES)

usage:
	@echo "make: sms smsd uninstall"

sms: FORCE
	for d in $(SMS_DIRECTORIES) ; do cd $$d ; make install ; cd .. ; done

smsd: FORCE
	for d in $(SMSD_DIRECTORIES) ; do cd $$d ; make install-smsd ; cd .. ; done

uninstall: FORCE
	for d in $(ALL_DIRECTORIES) ; do cd $$d ; make uninstall ; cd .. ; done

FORCE:
