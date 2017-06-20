## Testing a package install
The purpose of this application is to update the cert and key of the OpenHIM-core of the local machine and add the new cert to the trusted list of all relevant remote machines OpenHIM-cores. In addition, this application should remove the old cert from the trusted list of each relevant machine's OpenHIM-core.

### Steps
1. Install the package through the PPA
    - See `readme.md`
    - ensure you configure the `config.json` file
2. Force an update of the current certificate
    - self signed : `sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/ohim-selfsigned.key -out /etc/ssl/certs/ohim-selfsigned.crt`
    - letsencrypt : `sudo ./certbot-auto --config /etc/letsencrypt/configs/<configuration_name> certonly --force-renewal`
3. Run updater
    - `openhim-cert-updater`