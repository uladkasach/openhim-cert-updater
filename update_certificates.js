///////////////////////////////////
// Load all data and initialize objects
///////////////////////////////////
// wrap command line arguments
var command_line_arguments = process.argv;

// Load config
var config = require('./config.json');

// Load API
var api = require("./ohie_api.js");
//console.log(api);

// initialize api
api.user = config.user;


///////////////////////////////////
// Get certificate
///////////////////////////////////
var request_options = {
    path : "/keystore/cert",
    method : "GET",
}
var callback = function(res) {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    //res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
    }.bind(this));
}.bind(this);
api.send_request(config.machines.local, request_options, callback);

///////////////////////////////////
// update cert and key of local machine
///////////////////////////////////
var fs = require('fs');
var cert = fs.readFileSync(config.paths.cert, "utf8");
var key = fs.readFileSync(config.paths.key, "utf8");

// POST keystore/key, http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html#sets-the-him-server-key
var request_options = {
    path : "/keystore/key",
    method : "POST",
    data : JSON.stringify({"key" : key}),
    data_type : "json",
}
var callback = function(res) {
    //res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('UPDATE LOCAL KEY RESPONSE: ' + chunk);
    }.bind(this));
}.bind(this);
api.send_request(config.machines.local, request_options, callback);


// POST keystore/cert, http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html#sets-the-him-server-cert
var request_options = {
    path : "/keystore/cert",
    method : "POST",
    data : JSON.stringify({"cert" : cert}),
    data_type : "json",
}
var callback = function(res) {
    //res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('UPDATE LOCAL CERT RESPONSE: ' + chunk);
    }.bind(this));
}.bind(this);
api.send_request(config.machines.local, request_options, callback);