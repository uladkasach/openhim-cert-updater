/*
    cd /usr/share/openhim-cert-updater/
    openssl x509 -fingerprint -in /etc/ssl/certs/ohim-selfsigned.crt
*/
// show stack traces on unknown errors
var error_memory = {machines : [],};
process.on('unhandledRejection', (error)=>{
    console.log("ERROR : unhandledRejection : ")
    console.trace(error);
});

// Load config
var config = require('./config/config.json');

// Load interface
var ohim = require("./abstractions/ohim_highlevel_interface.js");

// initialize interface api
ohim.initialize(config.users);

var target_client_id = "openinfoman"
var target_machine = config.machines.remote[0];

var promise_to_fetch_target_client_by_name = ohim.promise_to_fetch_all_clients(target_machine)
    .then((response)=>{
        var data = JSON.parse(response.body);
        console.log(data);

        // find desired client
        for(var i=0; i < data.length; i++){
            let this_data = data[i];
            if(this_data.clientID == target_client_id){
                var target_client = this_data;
                break;
            }
        }

        // throw error if not found
        if(typeof target_client == "undefined") throw "Target Client " + target_client_id + " not found";

        // return target client, since found
        return target_client
    })
    .then((client)=>{
        console.log("Found client by name :");
        console.log(client);
        console.log("Retreiving full client data now : ")
        return ohim.promise_to_fetch_a_client(target_machine, client._id);
    })

var promise_new_fingerprint = Promise.resolve("93:43:08:F5:C5:51:28:EC:F4:33:A8:FE:C0:F9:67:1C:72:DB:73:97")

var update_certificate_for_client = Promise.all([promise_to_fetch_target_client_by_name, promise_new_fingerprint])
    .then((data_array)=>{
        var target_machine = data_array[0].target_machine;
        var client = JSON.parse(data_array[0].body);
        var new_fingerprint = data_array[1];
        console.log("old client:");
        console.log(client);

        // update fingerprint of client
        client.certFingerprint = new_fingerprint;

        console.log("updated client:");
        console.log(client);


        return ohim.promise_to_update_a_client(target_machine, client);
    })
    .then((response)=>{
        console.log("Update Response:");
        console.log(response);
    })
