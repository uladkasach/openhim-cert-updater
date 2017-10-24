/*
    Note, this script uses promisses everywhere to ensure that the async calls for removing relevant trusted keys from remote machines happen in the required order.
          it also uses many levels of abstraction.
    More information can be found in the readme about how this implementation is structured.
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Load all data and initialize objects
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// load command line arguments
var commandline_argument_parser = require('command-line-args')
var commandline_option_definitions = [
  { name : "help", type: Boolean },
  { name: 'log', alias: 'l', type: Boolean },
  { name: 'update_hook', alias: 'h', type: String, multiple: true},
]
var commandline_options = commandline_argument_parser(commandline_option_definitions)
if(commandline_options.help){
    console.log(commandline_option_definitions)
    process.exit();
}
console.log(commandline_options);

// load terminal command runner, for post hook
var cmd = require('node-cmd');

// load custom logger
var logger = require('./logger.js');

// show stack traces on unknown errors
var error_memory = {machines : [],};
process.on('unhandledRejection', (error)=>{
    valid_error_types = ["equivalent"]
    if (valid_error_types.indexOf(error.type) !== -1) return; // ignore valid errors

    if(error.type == "Unauthorized"){
        if(error_memory.machines.indexOf(error.machine) != -1) return; // error has already been shown. -- if multiple promises chain from one that throws an error, each promise that chains from it will need to catch the error or each time this error will be thrown
        error_memory.machines.push(error.machine);
        console.log("ERROR : Unauthorized Request")
        console.log(" `-> No updates or removals will occur");
        //console.trace(error);
    } else {
        console.log("ERROR : unhandledRejection : ")
        console.trace(error); 
    }
});

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
// record that the script has been run if command line argument is set
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if(commandline_options.log) logger.write("running at " + new Date())


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

        return resolve(data);

        if(old_certificate == cur_certificate){
            console.log("\nOld certificate and current certificate are equivalent. \n");
            reject({type : "equivalent"});
        } else {
            resolve(data);
        }
    })
})


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// update cert and key of local machine  -- after we retreive the old cert from local
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var update_cert_and_key_of_local = resolve_with_certificate_if_update_required
    .then((data) => {
        return ohim.promise_to_update_cert_and_key(config.machines.local, from_filesystem.key, from_filesystem.cert);
    })




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// get all trusted certificates foreach remote machine
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var set_of_promised_trusted_certs = [];
for(var i = 0; i < config.machines.remote.length; i++){
    console.log("---- running here for " + console.log(config.machines.remote[i]));
    var promise_to_get_trusted_certs_for_this_machine = ohim.promise_to_get_trusted_certs(config.machines.remote[i])
        .then((response)=>{
            if(response.body == "Unauthorized"){ // error checking
                logger.write("Retrieval of certificate for machine " + response.target_machine + " resolved in an Unauthorized Request. Machine could not be updated.");
                throw {type : "Unauthorized", machine : response.target_machine};
            }
        })
    set_of_promised_trusted_certs.push(promise_to_get_trusted_certs_for_this_machine);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// add new trusted cert to all remote machines who do not already have it
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var promise_all_machines_who_need_new_key_added = Promise.all(set_of_promised_trusted_certs)
    .then((data_array)=>{
        // return list of machines who do not have current cert
        var machines_without_cert = [];
        for (var i = 0; i < data_array.length; i++){
            var this_machine = data_array[i].target_machine;
            var these_certs = JSON.parse(data_array[i].body);
            var found = false;
            var cur_certificate = from_filesystem.cert.split("-----BEGIN CERTIFICATE-----")[1].split("-----END CERTIFICATE-----")[0];
            for(var j = 0; j < these_certs.length; j++){
                var this_certificate = these_certs[j].data.split("-----BEGIN CERTIFICATE-----")[1].split("-----END CERTIFICATE-----")[0];
                if(this_certificate == cur_certificate){
                    found = true;
                    break;
                }
            }
            if(found == false) machines_without_cert.push(this_machine);
        }
        console.log("machines without cert : " + machines_without_cert);
        return machines_without_cert;
    });
var promise_to_add_new_trusted_cert_to_all_remote_machines_without_cert = promise_all_machines_who_need_new_key_added
    .then((machines_without_cert) =>{
        // Note, this should run every time regardless of whether the old and current certificates are the same
        // - since it is possible there was a connection error with a remote machine and it did not get the new cert on last update
        var promise_additions = [];
        for(var i = 0; i < machines_without_cert.length; i++){
            var promise_this_addition = ohim.promise_to_add_trusted_cert(machines_without_cert[i], from_filesystem.cert);
            promise_additions.push(promise_this_addition);
        }
        return Promise.all(promise_additions);
    });


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// remove old trusted cert from all remote machines
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
    1. Get fingerprint for local machines machine old cert (this must be done before updating current key, completed by implementing all functionality on this script in form of promises)
    2. foreach remote machine, get all trusted certs (done previously)
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
// create a set of promises which waits for both the one fingerprint and the get certs (for the respective machine) promises to be resolved for each machine
var set_of_promised_certs_and_fingerprint_together = [];
for(var i = 0; i < set_of_promised_trusted_certs.length; i++){
    set_of_promised_certs_and_fingerprint_together.push(Promise.all([set_of_promised_trusted_certs[i], get_fingerprint_for_local_machines_old_cert]));
}
// for each promise of the trusted certificates + the fingerprint, find the _ids that corrospond to that fingerprint (returs a list of promises) and promise to remove them from remote machine
var promise_all_cert_removals_nessesary = [];
for(var i = 0; i < set_of_promised_certs_and_fingerprint_together.length; i++){
    var this_promise = set_of_promised_certs_and_fingerprint_together[i];
    var promise_all_cert_removals_for_this_machine = this_promise.then((values) => {
        var target_machine = values[0].target_machine;
        var all_trusted_certs = JSON.parse(values[0].body);
        var old_fingerprint = values[1];
        //console.log("old fingerprint " + old_fingerprint + " and " + all_trusted_certs.length + " trusted certs for " + target_machine);
        var ids_to_remove = [];
        for(var i = 0; i < all_trusted_certs.length; i++){
            var this_cert = all_trusted_certs[i];
            if(this_cert.fingerprint == old_fingerprint) ids_to_remove.push(this_cert._id);
        }
        //console.log("number of ids to remove for " + target_machine + " : " + ids_to_remove.length)

        // build list of promises to return;
        var promise_to_remove_old_certs = [];
        for(var i = 0; i < ids_to_remove.length; i++){
            (function(target_machine, id_to_remove){
                var promise_this_removal = ohim.promise_to_remove_trusted_cert(target_machine, id_to_remove);
                promise_to_remove_old_certs.push(promise_this_removal);
            })(target_machine, ids_to_remove[i]);
        }
        return Promise.all(promise_to_remove_old_certs);
    });
    promise_all_cert_removals_nessesary.push(promise_all_cert_removals_for_this_machine);
}
var promise_all_nessesary_cert_removals_have_completed = Promise.all(promise_all_cert_removals_nessesary);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// upon updating local certificate/key, run the update hook
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Note - the hook only runs if local is updated, if local is not, update hook is not run
Promise.all([update_cert_and_key_of_local])
    .then(()=>{
        if(typeof commandline_options.update_hook == "undefined") return true; // if no hook, done.

        // run update hook
        console.log("(!) Update Hook Running!");
        var update_hook = commandline_options.update_hook;
        //console.log(update_hook);
        if(commandline_options.log) logger.write("    `-> update hook, `" + update_hook + "` was triggered")
        cmd.run(commandline_options.update_hook);
    })
