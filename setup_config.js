"use strict"

// used to query user for input
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// used to output contents of config.example.json
var fs = require('fs');


console.log("Welcome to the openhim-cert-updater config.json setup interface.")
console.log("We need three things to successfully setup the config.json file:")
console.log("  1. Path to the cert and path to the key")
console.log("  2. Domain:port + authentication information of the local machine")
console.log("  3. Domain:port + authentication information of each remote machine")
console.log("Lets get started!")
console.log(" ")
console.log(".......................................................................")
console.log(" ")

/*
// removed because this will probably only cause confusion

console.log("In the end, we will create a file that looks like the following:")
fs.readFile('./config/config.example.json', (err, data)=>{
    console.log(".......................................................................")
    console.log(" ")

    console.log(data.toString('utf8'));

    console.log(" ")
    console.log(".......................................................................")
})
*/


var config_json = {
    paths : {
        cert : null,
        key : null,
    },
    machines : {
        local : null,
        remote : [],
    },
    users : {}
};



// Get paths for cert and key
var promise_paths_for_cert_and_key = new Promise((resolve, reject)=>{
    console.log("First, lets get the path to the cert and key.");
    resolve();
}). then((data)=>{
    return new Promise((resolve, reject)=>{
        console.log("Path to Cert ")
        console.log(" - Typically, this file is located at a path similar to /etc/ssl/certs/some_certificate_name.crt")
        rl.question('> ', (answer) => {
            config_json.paths.cert = answer;
            resolve("scs");
        });
    });
}).then((data)=>{
    return new Promise((resolve, reject)=>{
        console.log("Path to Key ")
        console.log(" - Typically, this file is located at a path similar to /etc/ssl/private/some_privatekey_name.key")
        rl.question('> ', (answer) => {
            config_json.paths.key = answer;
            resolve("scs");
        });
    })
}).then((data)=>{
    console.log(" ");
    console.log(" ");
});


// get local machine data
var promise_local_machine_data = promise_paths_for_cert_and_key.then((data)=>{
    console.log("Great. Now lets get information that will enable us to access your local openhim installation.");
}).then((data)=>{
    return new Promise((resolve, reject)=>{
        console.log("Local Machine Domain:Port  ")
        console.log(" - Typically the domain:port looks something like `localhost:8080` or `ip_address:8080` ")
        rl.question('> ', (answer) => {
            config_json.machines.local = answer;
            config_json.users[answer] = {
                email : null,
                password : null,
            };
            resolve(answer);
        });
    })
}).then((machine)=>{
    return new Promise((resolve, reject)=>{
        console.log("Local Machine Email  ")
        rl.question('> ', (answer) => {
            config_json.users[machine].email = answer;
            resolve(machine);
        });
    })
}).then((machine)=>{
    return new Promise((resolve, reject)=>{
        console.log("Local Machine Password  ")
        rl.question('> ', (answer) => {
            config_json.users[machine].password = answer;
            resolve("scs");
        });
    })
}).then((data)=>{
    console.log(" ");
});


// get remote machines
var promise_all_remote_machines = promise_local_machine_data.then((data)=>{
    return promise_loop(Promise.resolve(), return_remote_machine_loop_question);
}).then((data)=>{
    console.log();
    console.log("Writing configuration file...")
    return new Promise((resolve, reject)=>{
        fs.writeFile("./config/config.json", JSON.stringify(config_json, null, 4)), function(err) {
            if(err) {
                return console.log(err);
            }
            resolve("scs");
        });
    });
}).then((data)=>{
    console.log();
    console.log("Configuration file written successfully.")
    rl.close()
});






// create function which enables loop of promises (recursive);
function promise_loop(promise, fn) {
    return promise.then(fn).then((bool_loop_again)=>{
       // console.log("promise loop should go again? " + bool_loop_again)
       return bool_loop_again ? promise_loop(promise, fn) : Promise.resolve();
    });
}

// remote_machine_promise question of whether to loop
function return_remote_machine_loop_question(data){
    return new Promise((resolve, reject)=>{
        message = (config_json.machines.remote.length == 0) ? "add a remote openhim machine notify of updated certificates?" : "add another remote openhim machine?";
        console.log("Would you like to " + message + " [y/N]");
        rl.question('> ', (answer) => {
            var boolean = answer == "y" || answer === "Y";
            resolve(boolean);
        });
    }).then((bool_add_remote)=>{
        if(bool_add_remote){
            return return_remote_machine_promise();
        } else {
            return Promise.resolve(false);
        }
    })
}

// create a new machine promise
function return_remote_machine_promise(){
    return Promise.resolve().then((data)=>{
        console.log(" ")
        console.log("Great. Lets enter the info for this remote machine.");
    }).then((data)=>{
        return new Promise((resolve, reject)=>{
            console.log("Remote Machine Domain:Port  ")
            console.log(" - Typically the domain:port looks something like `ip_address:8080` ")
            rl.question('> ', (answer) => {
                config_json.machines.remote.push(answer);
                config_json.users[answer] = {
                    email : null,
                    password : null,
                };
                resolve(answer);
            });
        })
    }).then((machine)=>{
        return new Promise((resolve, reject)=>{
            console.log("Remote Machine Email  ")
            rl.question('> ', (answer) => {
                config_json.users[machine].email = answer;
                resolve(machine);
            });
        })
    }).then((machine)=>{
        return new Promise((resolve, reject)=>{
            console.log("Remote Machine Password  ")
            rl.question('> ', (answer) => {
                config_json.users[machine].password = answer;
                resolve("scs");
            });
        })
    }).then((data)=>{
        console.log(" ");
        return true;
    });
}
