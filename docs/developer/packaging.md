0. Navigate to a directory containing a vagrant that has been provisioned with the openhim-core app.
    - start the openhim-core app 
        - `vagrant ssh`
        - `openhim-core`
0. Build packages and test them
    - add cert_work root directory
        - `export CERTDIR=/var/www/git/Regenstrief/OHIE/certificate_renewal;`
    - build the pacakge
        - set GPG keys
            - e.g., `export DEB_SIGN_KEYID=F516F2E7`
        - `cd $CERTDIR/openhim-cert-updater/packaging/; ./create_deb.sh;`
            - say no when asking if to put to launchpad
    - move to vagrant
        - `cd $CERTDIR/ohim/core; rm *.deb; find $CERTDIR/openhim-cert-updater/packaging/builds -name "*.deb" -print0 | xargs --null cp -t $CERTDIR/ohim/core`
    - build it on the vagrant 
        - `cd $CERTDIR/ohim/core; vagrant ssh`
        - `sudo apt-get -y remove openhim-cert-updater`
        - `find /vagrant -name "*.deb" -print0 | xargs --null  sudo dpkg -i; `
        - `sudo apt-get install -f`
        
0. Test the PPA 
    - `sudo add-apt-repository ppa:uladkasach/dev && sudo apt-get update && sudo apt-get -y install openhim-cert-updater`
    - `openhim-cert-updater`