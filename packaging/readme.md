## Usage
0. Ensure your DEBFULLNAME and DEBEMAIL are defined
    - in your `~/.bashrc` you should have the following commands
        - `export DEBFULLNAME=<yourname>`
        - `export DEBEMAIL=<youremail>`
    - this information will be used to populate the changelog

0. To build the package to test:
    - `./create_deb.sh`

0. To build the package and push to launchpad
    1. set the GPG key to use
        - e.g., `export DEB_SIGN_KEYID=F516F2E7`
    2. `./create_deb.sh`

## Details

This script expects the directory structure of, assuming root is where this script is located,:


    targets/trusty/...
                  /debian
                  /<others>

Where trusty can be any ubuntu build, the `debian` directory contains the regular files required for a debian build, and `<others>` are all files that you would expect to "install" on the target system.



## Testing
0. To copy .deb over to a ssh'd machine
    1. find path of debian package
        ```
DEBPATH=`find $PWD/builds -name "*.deb"`
        ```
    2. csp over to target
        -  `scp $DEBPATH root@install-ohie.ohie.org:/home/`

    3. install
        - `dpkg -i ...`

1. To copy .deb to vagrant, remove old package, and install new one
    0. define path of vagrant root
        - `VAGRANTROOT=/var/www/Regenstrief/OHIE/certificate_renewal/ohim/core/`
    1. find path of debian package
        ```
        DEBPATH=`find $PWD/builds -name "*.deb"`
        ```
    2. move to vagrant
        - `find $VAGRANTROOT -name "*.bak" -type f -delete;`
        - `find $VAGRANTROOT -name "*.deb" -type f -delete;`
        - `cp $DEBPATH $VAGRANTROOT`

    - build it on the vagrant
        - `cd $VAGRANTROOT; vagrant ssh;`
        - `sudo apt-get -y remove openhim-cert-updater`
            - use `purge` if you want to get rid of the config file too
        - `find /vagrant -name "*.deb" -print0 | xargs --null  sudo dpkg -i; `
        - `sudo apt-get install -f`
