module.exports = {
    api : require("./ohim_request_api.js"),

    initialize : function(users){
        this.api.users = users;
    },

    return_callback_function : function(target_machine, display, trigger){
        return function(res) {
            if(display.status === true) console.log(display.base + res.statusCode);
            var body = "";
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function() {
                if(display.body === true) console.log(display.base + body);
                if(typeof trigger !== "undefined") trigger({target_machine : target_machine, body : body});
            });
        }.bind(this);
    },

    promise_to_fetch_all_clients : function(target_machine){
        var request_options = {
            path : "/clients",
            method : "GET",
        }
        return new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                return new Promise((resolve, reject)=>{
                    console.log('GET CLIENTS FROM `'+ target_machine + '` RESPONSE:  '+ res.statusCode);
                    var body = "";
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        // console.log(display.base + body);
                        return resolve({target_machine : target_machine, body : body});
                    });
                })
            })
    },

    promise_to_fetch_a_client : function(target_machine, client_id){
        var request_options = {
            path : "/clients/" + client_id,
            method : "GET",
        }
        return new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                return new Promise((resolve, reject)=>{
                    console.log('GET A CLIENT FROM `'+ target_machine + '` RESPONSE:  '+ res.statusCode);
                    var body = "";
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        // console.log(display.base + body);
                        return resolve({target_machine : target_machine, body : body});
                    });
                })
            })
    },
    promise_to_update_a_client : function(target_machine, updated_client){
        // POST keystore/key, http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html#update-a-client
        // per ryan critton's suggestion, replace client in full
        // sends full new client to api
        var request_options = {
            path : "/clients/"+updated_client._id,
            method : "PUT",
            data : JSON.stringify(updated_client),
            data_type : "json",
        }
        return new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                return new Promise((resolve, reject)=>{
                    console.log('UPDATE CLIENT ON REMOTE `'+ target_machine + '`  RESPONSE: ' + res.statusCode);
                    var body = "";
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        // console.log(display.base + body);
                        return resolve({target_machine : target_machine, body : body, status : res.statusCode});
                    });
                })
            })

    },

    promise_to_get_trusted_certs : function(target_machine){
        ////////////////////////////////////
        // Get trusted ca certs on a machine
        ////////////////////////////////////
        var request_options = {
            path : "/keystore/ca",
            method : "GET",
        }
        return new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                return new Promise((resolve, reject)=>{
                    console.log('GET TRUSTED CERTS FROM `'+ target_machine + '` RESPONSE:  '+ res.statusCode);
                    var body = "";
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        // console.log(display.base + body);
                        return resolve({target_machine : target_machine, body : body});
                    });
                })
            })
    },

    promise_to_get_cert : function(target_machine){
        var request_options = {
            path : "/keystore/cert",
            method : "GET",
        }
        return new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                return new Promise((resolve, reject)=>{
                    console.log('RETREIVE CERT ON `'+ target_machine + '` RESPONSE:  '+ res.statusCode);
                    var body = "";
                    res.on('data', function (chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        // console.log(display.base + body);
                        return resolve({target_machine : target_machine, body : body});
                    });
                })
            })
    },


    promise_to_update_cert_and_key : function(target_machine, key, cert){
        // POST keystore/key, http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html#sets-the-him-server-key
        var request_options = {
            path : "/keystore/key",
            method : "POST",
            data : JSON.stringify({"key" : key}),
            data_type : "json",
        }
        var promise_local_cert_update = new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                return new Promise((resolve, reject)=>{
                    res.on('data', function (chunk) {
                         console.log('UPDATE KEY ON `'+ target_machine + '`  RESPONSE: ' + chunk);
                         resolve(true);
                    }.bind(this));
                })
            })

        // POST keystore/cert, http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html#sets-the-him-server-cert
        var request_options = {
            path : "/keystore/cert",
            method : "POST",
            data : JSON.stringify({"cert" : cert}),
            data_type : "json",
        }
        var promise_local_key_update = new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                return new Promise((resolve, reject)=>{
                    res.on('data', function (chunk) {
                         console.log('UPDATE CERT ON `'+ target_machine + '`  RESPONSE: ' + chunk);
                         resolve(true);
                    }.bind(this));
                })
            })

        return Promise.all([promise_local_cert_update, promise_local_key_update]);
    },

    promise_to_add_trusted_cert : function(target_machine, cert){
        // POST keystore/ca/cert
        var request_options = {
            path : "/keystore/ca/cert",
            method : "POST",
            data : JSON.stringify({"cert" : cert}),
            data_type : "json",
        }
        return new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                res.on('data', function (chunk) {
                     console.log('ADD TRUSTED CERT TO REMOTE `'+ target_machine + '`  RESPONSE: ' + chunk);
                }.bind(this));
                return true;
            })
    },

    promise_to_remove_trusted_cert : function(target_machine, cert_id){
        // DELETE keystore/ca/_id
        //var cert_id = "B8:78:BD:23:C5:F1:BA:06:13:97:67:B0:53:93:FC:C2:C5:B0:38:6A";
        var request_options = {
            path : "/keystore/ca/" + cert_id,
            method : "DELETE",
        }
        return new Promise((resolve, reject)=>{
                this.api.send_request(target_machine, request_options, resolve);
            })
            .then((res)=>{
                res.on('data', function (chunk) {
                     console.log('REMOVE TRUSTED CERT FROM REMOTE `'+ target_machine + '`  RESPONSE: ' + chunk);
                }.bind(this));
                return true;
            })

    },

}
