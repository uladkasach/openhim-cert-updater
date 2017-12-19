//  openssl x509 -fingerprint -in /etc/ssl/certs/ohim-selfsigned.crt


// Load config
var config = require('./config/config.json');

// get local cert and key from filesystem
var fs = require('fs');
var key_fingerprint = require('key-fingerprint').fingerprint;
var cert = fs.readFileSync(config.paths.cert, "utf8");
var key = fs.readFileSync(config.paths.key, "utf8");
var fingerprint = key_fingerprint(cert, 'sha1', true).toUpperCase();
var from_filesystem = {
    cert : cert,
    key : key,
    fingerprint : fingerprint,
};


console.log(fingerprint)
