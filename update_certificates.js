/*
    Note, this script uses promisses everywhere to ensure that the async calls for removing relevant trusted keys from remote machines happen in the required order.
          it also uses many levels of abstraction.
    More information can be found in the readme about how this implementation is structured.
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Load all data and initialize objects
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// wrap command line arguments
var command_line_arguments = process.argv;

// Load config
var config = require('./config/config.json');

// Load interface
var ohim = require("./abstractions/ohim_highlevel_interface.js");

// initialize interface api
ohim.initialize(config.users);

// get local cert and key from filesystem
var fs = require('fs');
var cert = fs.readFileSync(config.paths.cert, "utf8");
var key = fs.readFileSync(config.paths.key, "utf8");
var from_filesystem = {
    cert : cert,
    key : key,
};

// prettyfy terminal
console.log("\n---------------- BEGIN UPDATE_CERTIFICATES.JS ----------------\n");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// retreive old certificate from local
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var retreive_old_cert_from_local = new Promise((resolve, reject) => {
    ohim.get_cert(config.machines.local, resolve);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// verify that old certificate is different from the current certificate in the file system
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var resolve_with_certificate_if_update_required = retreive_old_cert_from_local.then((data)=>{
    return new Promise((resolve, reject)=>{
        var old_certificate = JSON.parse(data.body)["data"].split("-----BEGIN CERTIFICATE-----")[1].split("-----END CERTIFICATE-----")[0];
        var cur_certificate = from_filesystem.cert.split("-----BEGIN CERTIFICATE-----")[1].split("-----END CERTIFICATE-----")[0];
        if(old_certificate == cur_certificate){
            console.log("\nOld certificate and current certificate are equivalent. No updates will be conducted.\n");
        } else {
            resolve(data);
        }
    })
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// update cert and key of local machine  -- after we retreive the old cert from local
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var update_cert_and_key_of_local = resolve_with_certificate_if_update_required.then((data) => {
    return new Promise((resolve, reject) => {
        ohim.update_cert_and_key(config.machines.local, from_filesystem.key, from_filesystem.cert);
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// add new trusted cert to all remote machines
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var add_new_truted_cert_to_all_remote_machines = resolve_with_certificate_if_update_required.then((data) =>{
    return new Promise((resolve, reject) => {
        for(var i = 0; i < config.machines.remote.length; i++){
            ohim.add_trusted_cert(config.machines.remote[i], from_filesystem.cert);
        }
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// remove old trusted cert from all remote machines
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
    1. Get fingerprint for local machines machine old cert (this must be done before updating current key, completed by implementing all functionality on this script in form of promises)
    2. foreach remote machine, get all trusted certs
    3. for each set of certs, use the fingerprint and find the _ids that correspond to that fingerprint
    4. for each corresponding _id, remove that cert from that machine
*/

// get fingerprint for local machine's old cert
var get_fingerprint_for_local_machines_old_cert = resolve_with_certificate_if_update_required.then((data) => {
    return new Promise((resolve, reject) => {
        var old_cert = JSON.parse(data.body);
        var old_cert_fingerprint = old_cert.fingerprint;
        resolve(old_cert_fingerprint);
    });
});
// for each machine, get a set of trusted certificates (returns a list of promises)
var set_of_promised_trusted_certs = [];
for(var i = 0; i < config.machines.remote.length; i++){
    set_of_promised_trusted_certs.push(new Promise((resolve, reject) => {
        //console.log("getting trusted certificates for " + config.machines.remote[i]);
        ohim.get_trusted_certs(config.machines.remote[i], resolve);
    }));
}
// create a set of promises which waits for both the one fingerprint and the get certs (for the respective machine) promises to be resolved for each machine
var set_of_promised_certs_and_fingerprint_together = [];
for(var i = 0; i < set_of_promised_trusted_certs.length; i++){
    set_of_promised_certs_and_fingerprint_together.push(Promise.all([set_of_promised_trusted_certs[i], get_fingerprint_for_local_machines_old_cert]));
}
// for each promise of the trusted certificates + the fingerprint, find the _ids that corrospond to that fingerprint (returs a list of promises)
set_of_promised_certs_and_fingerprint_together.forEach(function(promise){
    var these_id_removal_promises = promise.then((values) => {
        var target_machine = values[0].target_machine; 
        var all_trusted_certs = JSON.parse(values[0].body); 
        var old_fingerprint = values[1];
        //console.log("old fingerprint " + old_fingerprint + " and " + all_trusted_certs.length + " trusted certs for " + target_machine);
        var ids_to_remove = [];
        for(var i = 0; i < all_trusted_certs.length; i++){
            var this_cert = all_trusted_certs[i];
            if(this_cert.fingerprint == old_fingerprint) ids_to_remove.push(this_cert._id);
        }
        console.log("number of ids to remove for " + target_machine + " : " + ids_to_remove.length)
        
        // build list of promises to return;
        for(var i = 0; i < ids_to_remove.length; i++){
            (function(target_machine, id_to_remove){
                ohim.remove_trusted_cert(target_machine, id_to_remove);  
            })(target_machine, ids_to_remove[i]);  
        }
    });
});
