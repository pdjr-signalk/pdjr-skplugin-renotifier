EMAIL_DIRECTORIES = email
SMS_DIRECTORIES = gammu sms
SMSD_DIRECTORIES = gammu sms systemd
ALL_DIRECTORIES = $(SMSD_DIRECTORIES)

usage:
	@echo "usage: make [email] [sms] [smsd] uninstall"
    

email: FORCE
	for d in $(EMAIL_DIRECTORIES) ; do cd $$d ; make install ; cd .. ; done

remove-email: FORCE
	for d in $(EMAIL_DIRECTORIES) ; do cd $$d ; make uninstall ; cd .. ; done
    

sms: FORCE
	for d in $(SMS_DIRECTORIES) ; do cd $$d ; make install ; cd .. ; done

smsd: FORCE
	for d in $(SMSD_DIRECTORIES) ; do cd $$d ; make install-smsd ; cd .. ; done

all: FORCE
	for d in $(ALL_DIRECTORIES) ; do cd $$d ; make install ; cd .. ; done

remove-all: FORCE
	for d in $(ALL_DIRECTORIES) ; do cd $$d ; make uninstall ; cd .. ; done

FORCE:
