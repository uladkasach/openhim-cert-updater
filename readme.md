# openhim-cert-updater
`openhim-cert-updater` is an NPM package that handles informing both local and remote OpenHIM installations about ssl certificate updates/renewals.

## Usage
#### With Package Installation
The package utilizes NVM to ensure that the script will be run in the appropriate nodejs environment. NVM is installed under the user `openhim_cert_updater` and so commands running the script must be run as that user. E.g.:
- run updater check: `sudo su openhim_cert_updater bash -c 'sudo openhim-cert-updater'`
- config file help: `sudo su openhim_cert_updater bash -c 'sudo openhim-cert-updater -c'`

#### With Manual Installation
- after installing the application manually with the instructions below, run `sudo nodejs update_certificates.js`

## Overview
#### scripts
- `update_certificates.js`
    - This file runs the required updates for all specified ohim-core machines.
    - This file utilizes javascript's `promise` feature for async handling as well as several custom layers of abstraction for communication with ohie-core applications
- `setup_config.js`
    - This file enables CLI setup of the `config/config.js` file through command line prompts.
- ` config/config.js`
    - This file stores the configurable settings (remote machine addresses, login information, path to cert and key) required for the certificate update process
- `abstrations/*`
    - These files contain abstraction interfaces relating to:
        - creating http/https requests with nodejs (`request_handler.js`)
        - creating authenticated requests to openhim (`ohim_request_api`)
        - manipulating openhim configurations through the openhim-core api (`ohim_highlevel_interface`)

#### packaged features
- `openhim-cert-updater`
    - this shell script is installed under `usr/bin/openhim-cert-updater` and thus is callable from the commandline anywhere.
    - arguments
        - no arguments: run `update_certificates.js`
        - `-l` run `update_certificates.js` and log that it ran
        - `-h <CMD>` run `update_certificates.js` and execute the shell command `<CMD>` if the local certificate was updated
        - `-l -h <CMD>` : do both of the above
        - `-c` calls `setup_config.js` and enables generation of the `config/config.js` file
        - `-c -m` calls `sudo nano $PATH_TO_CONFIG/config.js` and enables user to manually modify the config file
    - for example:
        - `sudo openhim-cert-updater -h 'touch ~/done.example'` will create the file `done.example` in your home directory IF the local certificate was updated  


## Installation From PPA Package
0. Install from PPA
    - `sudo add-apt-repository ppa:uladkasach/dev && sudo apt-get update && sudo apt-get -y install openhim-cert-updater`
1. Setup `config.json`
    - see below
2. Test installation
    - `openhim-cert-updater`

## Installation From Source Package
0. Download `.deb` file
    - `wget https://github.com/uladkasach/openhim-cert-updater/releases/download/v1.2.8/openhim-cert-updater_1.2.8~trusty_amd64.deb`
1. Install `.deb` file
    - `sudo dpkg -i openhim-cert-updater_1.2.8~trusty_amd64.deb`
2. Install dependencies
    - `sudo apt-get install -f`
3. Setup `config.json`
    - see below
4. Test installation
    - `openhim-cert-updater`

## Installation From Source Code
00. Prerequisites  
    - [Install node and npm](http://letmegooglethatforyou.com/?q=how+to+install+node+and+npm)
0. Install
    - from NPM repository
        - `npm install -U openhim-cert-updater`
    - from sourcecode
        - navigate to root directory
        - `npm install`
1. Setup `config.json`
    - See below
2. Test it out
    - `sudo nodejs update_certificates.js`


## Setup Config.json
0. create a `config/config.json` file by copying the `config/config.example.json` file
    - `openhim-cert-updater -c -r`
1. edit the `config/config.json` to reflect your configuration
    - the file can be opened in nano with `openhim-cert-updater -c -r`
    - define the `host:port` of each OpenHIM installation (local and remote) that need to be updated
        - local is required
        - remote is optional
    - define the `email` and `password` for each machine (required), identified by `host:port`, in the `config.users` object.
        - e.g., `"localhost:8080" : { "email" : "root@openhim.org",  "password" : "openhim-password" }`
    - define which clients need to be updated to use the new certificate on each machine
        - e.g., `"remote_host:8080" : ["client_id"]`
    - define the `paths.cert` and `paths.key` paths to the most up to date `cert` and `key` for this machine's OpenHIM installation
        - on a machine w/ certs created by `letsencrypt`/`certbot`
            - cert : `/etc/letsencrypt/live/<your_domain>/fullchain.pem`
            - key : `/etc/letsencrypt/live/<your_domain>/privkey.pem`
        - on a machine w/ certs created by `sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/ohim-selfsigned.key -out /etc/ssl/certs/ohim-selfsigned.crt`
            - cert : `/etc/ssl/certs/ohim-selfsigned.crt`
            - key : `/etc/ssl/private/ohim-selfsigned.key`

## Implementation
The script `update_certificates.js` does several things:
0. Checks whether the `cert` and `key` found at `config.paths` is different than the one recorded in the local OpenHIM installation
    - if they are the same, then the script terminates because there is no update that is requried.
1. Updates the local OpenHIM installation with the most up to date `cert` and `key` available.   
    - Replaces the `cert` and `key` of the local OpenHIM installation with the `cert` and `key` found at the specified `config.paths`.
2. "Informs" the remote OpenHIM installations about the most up to date `cert` for this local machine
    - Adds the new `cert` to the `trusted ca certs` of all `config.machines.remote` machines.
3. Cleans up the `trusted ca certs` list of each `config.machines.remote` machine.
    - Removes the `old_cert` from the `trusted ca certs` list of each `config.machines.remote` machine.

The package includes an `openhim-request-api` which handles creating properly authenticated requests and an `openhim-toplevel-interface` that creates an easy to use layer of abstraction, implementing the various API calls availible per the [openhim RESTful api](http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html).
