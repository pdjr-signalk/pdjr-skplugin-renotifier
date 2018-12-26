usage:
	@echo "make ( install | install-smsd | uninstall )"

install: gammurc
	/bin/cp gammurc /etc/

install-smsd: gammurc gammu-smsdrc
	/bin/cp gammu-smsdrc /etc/

uninstall:
	/bin/rm -f /etc/gammurc /etc/gammu-smsdrc

gammu-smsdrc: gammurc gammu-smsdrc.smsd.snippet
	/bin/sed -n '/\[gammu\]/,/^$$/p' gammurc > gammu-smsdrc
	/bin/cat gammu-smsdrc.smsd.snippet >> gammu-smsdrc

gammurc:
	/usr/bin/gammu-detect -b > gammurc

