#!/bin/bash
# Exit on error
set -e


PACKAGINGHOME=`pwd`
AWK=/usr/bin/awk
HEAD=/usr/bin/head
DCH=/usr/bin/dch



cd $PACKAGINGHOME/targets
TARGETS=(*)
echo "Targets: $TARGETS"
cd $PACKAGINGHOME


PKG=openhim-cert-updater

echo -n "Would you like to upload the build(s) to Launchpad? [y/N] "
read UPLOAD
if [[ "$UPLOAD" == "y" || "$UPLOAD" == "Y" ]];  then
    if [ -n "$LAUNCHPADPPALOGIN" ]; then
      echo Using $LAUNCHPADPPALOGIN for Launchpad PPA login
      echo "To Change You can do: export LAUNCHPADPPALOGIN=$LAUNCHPADPPALOGIN"
    else
      echo -n "Enter your launchpad login for the ppa and press [ENTER]: "
      read LAUNCHPADPPALOGIN
      echo "You can do: export LAUNCHPADPPALOGIN=$LAUNCHPADPPALOGIN to avoid this step in the future"
    fi

    if [ -n "${DEB_SIGN_KEYID}" ]; then
      echo Using ${DEB_SIGN_KEYID} for Launchpad PPA login
      echo "To Change You can do: export DEB_SIGN_KEYID=${DEB_SIGN_KEYID}"
      echo "For unsigned you can do: export DEB_SIGN_KEYID="
    else
      echo "No DEB_SIGN_KEYID key has been set.  Will create an unsigned"
      echo "To set a key for signing do: export DEB_SIGN_KEYID=<KEYID>"
      echo "Use gpg --list-keys to see the available keys"
    fi

    echo -n "Enter the name of the PPA: "
    read PPA
fi


BUILDDIR=$PACKAGINGHOME/builds
echo -n "Clearing out previous builds... "
rm -rf $BUILDDIR
echo "Done."

for TARGET in "${TARGETS[@]}"
do
    TARGETDIR=$PACKAGINGHOME/targets/$TARGET

    ## Define next build number
    RLS=`$HEAD -1 $TARGETDIR/debian/changelog | $AWK '{print $2}' | $AWK -F~ '{print $1}' | $AWK -F\( '{print $2}'`
    echo "Last build number is $RLS"
    echo "What should the next build number be?"
    read BUILDNO
    
    ## Define next build name
    BUILD=${PKG}_${BUILDNO}~${TARGET}
    echo "Building $BUILD ..."

    # Update changelog
    cd $TARGETDIR
    echo "Updating changelog for build ..."
    $DCH -Mv "${BUILDNO}~${TARGET}" --distribution "${TARGET}" "Release Debian Build ${OPENHIM_VERSION}-${BUILDNO}."

    # Clear and create packaging directory
    PKGDIR=${BUILDDIR}/${BUILD}
    rm -fr $PKGDIR
    mkdir -p $PKGDIR
    cp -R $TARGETDIR/* $PKGDIR

    # Install package from NPM to get latest files to include in package
    cd /tmp
    TGZ=`npm pack openhim-cert-updater`
    tar xvzf $TGZ
    cd /tmp/package
    npm install --production
    mkdir -p $PKGDIR/usr/share/openhim-cert-updater
    mv /tmp/package/* $PKGDIR/usr/share/openhim-cert-updater
    rm -r /tmp/package

    # Build package
    cd $PKGDIR
    if [[ "$UPLOAD" == "y" || "$UPLOAD" == "Y" ]] && [[ -n "${DEB_SIGN_KEYID}" && -n "{$LAUNCHPADLOGIN}" ]]; then
        echo " ";
        echo "Uploading to PPA ${LAUNCHPADPPALOGIN}/${PPA}"

    	DPKGCMD="debuild -k${DEB_SIGN_KEYID} -S -sa"
        echo "$DPKGCMD"
        $DPKGCMD
        
    	DPUTCMD="dput ppa:$LAUNCHPADPPALOGIN/$PPA ../${BUILD}_source.changes"
        echo "$DPUTCMD"
    	$DPUTCMD
    else 
        DPKGCMD="debuild -uc -us"
        $DPKGCMD
    fi
done