# openhim-cert-updater
`openhim-cert-updater` is an NPM package that handles informing both local and remote OpenHIM installations about ssl certificate updates/renewals.

## Usage
- after installing the application with the instructions below, run `sudo nodejs update_certificates.js` 

## Overview
- `update_certificates.js`
    - This file runs the required updates for all specified ohim-core machines.
    - This file utilizes javascript's `promise` feature for async handling as well as several custom layers of abstraction for communication with ohie-core applications
- ` config/config.js`
    - This file stores the configurable settings (remote machine addresses, login information, path to cert and key) required for the certificate update process
- `abstrations/*` 
    - These files contain abstraction interfaces relating to:
        - creating http/https requests with nodejs (`request_handler.js`)
        - creating authenticated requests to openhim (`ohim_request_api`)
        - manipulating openhim configurations through the openhim-core api (`ohim_highlevel_interface`)

## Installation From PPA
0. Install from PPA
    - `sudo add-apt-repository ppa:uladkasach/dev && sudo apt-get update && sudo apt-get -y install openhim-cert-updater`
1. Setup `config.json`
2. Test installation
    - `openhim-cert-updater`

## Installation From Source
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

## Setup Config.json with the CLI
Note, this CLI will be triggered automatically if you install `openhim-cert-updater` by package. It can also be triggered by running `openhim-cert-updater -c`
- you will have to find where the cert and privkey for openhim / from certbot are stored 
    - on a machine w/ certs created by `letsencrypt`/`certbot`
        - cert : `/etc/letsencrypt/live/<your_domain>/fullchain.pem`
        - key : `/etc/letsencrypt/live/<your_domain>/privkey.pem`
    - on a machine w/ certs created by `sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/ohim-selfsigned.key -out /etc/ssl/certs/ohim-selfsigned.crt`
        - cert : `/etc/ssl/certs/ohim-selfsigned.crt`
        - key : `/etc/ssl/private/ohim-selfsigned.key`
- you will have to know the localhost path and authentication information (email and password) for a user w/ permissions to update the certificate on the local machine
    - on a default installation:
        - host : `localhost:8080`
        - root user  
            - email : `root@openhim.org`
            - password : `openhim-password`
- you will have to know the path and authentication information for similar user on relevant remote machines, if you want them to be "informed" on the update
- if you mess up durring the configuration process, start over by calling the config CLI again w/ `openhim-cert-updater -c`
- test installation by running `sudo openhim-cert-updater`.
    - note, you should see the updater inform you that all is already up to date.

## Setup Config.json Manually
0. create a `config/config.json` file by copying the `config/config.example.json` file 
    - `cp config/config.example.json config/config.json`
1. edit the `config/config.json` to reflect your configuration
    - define the `host:port` of each OpenHIM installation (local and remote) that need to be updated
        - local is required
        - remote is optional
    - define the `email` and `password` for each machine (required), identified by `host:port`, in the `config.users` object. 
        - e.g., `"localhost:8080" : { "email" : "root@openhim.org",  "password" : "openhim-password" }`
    - define the `paths.cert` and `paths.key` paths to the most up to date `cert` and `key` for this machine's OpenHIM installation

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

