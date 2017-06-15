module.exports = {
    CryptoJS : require("crypto-js"), // imported javascript object
    
    user : null, // user data is stored here for authentication purposes
    auth : {}, // authentication data is stored here for the same reason - but distinct as it is distinct for each machine that we contact and it is generated through API 
               // auth is "keyed" by target_machine's
               // an object is added for each machine upon the first run of a request to it. 
               // it stores the header information which is required for requests.
    request_handler : require("./request_handler.js"),  // require http module for making requestsvar 
    
    
    ///////////////////////////////////
    // Handle authentication 
    ///////////////////////////////////
    // use the auth data retreived from the target_machine to set the header parameters required for authenticating an OHIM request
    retreive_authentication_data : function(target_machine){
        if(typeof this.auth[target_machine] !== 'object'){ // if not an object, then auth data was not set yet.
            return false;
        }
        
        var password_hash = this.auth[target_machine].hash;
        var request_salt = this.CryptoJS.lib.WordArray.random(16).toString();
        var request_timestamp = this.get_machine_mapped_timestamp(target_machine);
        
        var sha512 = this.CryptoJS.algo.SHA512.create();
        sha512.update(password_hash);
        sha512.update(request_salt);
        sha512.update(request_timestamp);
        var hash = sha512.finalize().toString(this.CryptoJS.enc.Hex);
        
        var authentication_data = {
            'auth-username' : this.user.email,
            'auth-ts' : request_timestamp,
            'auth-salt' : request_salt,
            'auth-token' : hash
        }
        return authentication_data;
    },
    // send the request retreiving the auth data for a target_machine for this user
    request_authentication : function(target_machine){
        ///////////////////////
        // Validate Request 
        ///////////////////////
        if(this.auth[target_machine] === undefined){
            this.auth[target_machine] = "pending";
        } else if(this.auth[target_machine] === "pending"){
            console.log("authentication pending...");
            return "pending";
        } else {
            console.log("Authentication request triggered for an already authenticated target_machine");
            return true;
        }
        
        /////////////////////////
        // Build Request
        /////////////////////////
        // split target_machine into host and port
        var parts = target_machine.split(":");
        var host = parts[0];
        var port = parseInt(parts[1]);
        
        var request_options = {
            host: host,
            port: port,
            path: "/authenticate/" + this.user.email,
            method: 'GET',
            use_ssl : true,
        }
        var callback = function(res) {
            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            //res.setEncoding('utf8');
            res.on('data', function (chunk) {
                //console.log('BODY: ' + chunk);
                this.authenticate_user_for_machine(JSON.parse(chunk), target_machine);
            }.bind(this));
        }.bind(this);
        this.request_handler.send_request(request_options, callback);
        
    },
    // handle the response to the auth data retreived from the target_machine for this user
    authenticate_user_for_machine : function(auth_response, target_machine){
        this.auth[target_machine] = {};
        
        var client_timestamp = new Date().getTime();
        var server_timestamp = new Date(auth_response.ts).getTime();
        var time_diff = server_timestamp - client_timestamp;
        this.auth[target_machine].time_diff = time_diff;
        
        var sha512 = this.CryptoJS.algo.SHA512.create();
        sha512.update(auth_response.salt);
        sha512.update(this.user.password);
        var hash = sha512.finalize().toString(this.CryptoJS.enc.Hex);
        this.auth[target_machine].hash = hash;
        console.log("Authentication for target_machine `" + target_machine + "` was successful.");
    },
    
    ////////////////////////////////////
    // Handle sending request
    ////////////////////////////////////
    send_request : function(target_machine, request_options, callback){
        // ensure request_type is valid
        var request_method = request_options.method;
        if(["POST", "GET"].indexOf(request_method) == -1){
            console.error("request method (" + request_method + ") is not valid for request_handler.send_request.");
            return false;
        }
        
        // get authentication data
        var authentication_data = this.retreive_authentication_data(target_machine);
        if(authentication_data == false){
            this.request_authentication(target_machine); // request authentication
            setTimeout(function(){ this.send_request(target_machine, request_options, callback) }.bind(this), 200); // try again in 300 ms.
            return;
        }
        
        // split target_machine into host and port
        var parts = target_machine.split(":");
        var host = parts[0];
        var port = parts[1];
        
        
        // define header data
        var header_data = authentication_data;
        if(request_options.data_type == "json") header_data['Content-Type'] = 'application/json';
        
        // build request and send it
        var request_options = {
            host: host,
            port: port,
            path: request_options.path,
            method: request_options.method,
            data : request_options.data,
            use_ssl : true,
            headers : header_data,
        }
        console.log("Sending request " + request_options.method + " " + target_machine + request_options.path + "...");
        this.request_handler.send_request(request_options, callback);
        
        /*
        var request_options = {
            path : "keystore/cert",
            type : "GET",
        }
        */


        /*
        request_options = {
            host: 'www.google.com',
            port: 80,
            path: '/',
            method: 'GET',
        }
        //console.log(api.request_handler);

        callback = function(res) {
          console.log('STATUS: ' + res.statusCode);
          console.log('HEADERS: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
          });
        }
        api.request_handler.send_request(request_options, callback);
        */
        
        
        
    },
    /////////////////////////////////////
    // Utility functions
    /////////////////////////////////////
    get_machine_mapped_timestamp : function(target_machine){
        return new Date(Math.abs(new Date().getTime() + this.auth[target_machine].time_diff)).toISOString();
    },
}