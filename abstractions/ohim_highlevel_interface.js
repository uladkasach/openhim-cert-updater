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
    
    get_trusted_certs : function(target_machine, trigger){
        ////////////////////////////////////
        // Get trusted ca certs on a machine
        ////////////////////////////////////
        var request_options = {
            path : "/keystore/ca",
            method : "GET",
        }
        var display = {
            base : 'GET TRUSTED CERTS FROM `'+ target_machine + '` RESPONSE: ',
            status : true,
        }
        var callback = this.return_callback_function(target_machine, display, trigger); 
        this.api.send_request(target_machine, request_options, callback);
    },
    
    get_cert : function(target_machine, trigger){
        var request_options = {
            path : "/keystore/cert",
            method : "GET",
        }
        var display = {
            base : 'RETREIVE CERT ON `'+ target_machine + '` RESPONSE: ',
            status : true,
        }
        var prechunk = false;
        var callback = this.return_callback_function(target_machine, display, trigger); 
        this.api.send_request(target_machine, request_options, callback);
    },
    
    
    update_cert_and_key : function(target_machine, key, cert){
        // POST keystore/key, http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html#sets-the-him-server-key
        var request_options = {
            path : "/keystore/key",
            method : "POST",
            data : JSON.stringify({"key" : key}),
            data_type : "json",
        }
        var callback =  function(res) { res.on('data', function (chunk) {  console.log('UPDATE KEY ON `'+ target_machine + '` RESPONSE: ' + chunk); }.bind(this)); }.bind(this);
        this.api.send_request(target_machine, request_options, callback);

        // POST keystore/cert, http://openhim.readthedocs.io/en/latest/dev-guide/api-ref.html#sets-the-him-server-cert
        var request_options = {
            path : "/keystore/cert",
            method : "POST",
            data : JSON.stringify({"cert" : cert}),
            data_type : "json",
        }
        var callback =  function(res) { res.on('data', function (chunk) {  console.log('UPDATE CERT ON `'+ target_machine + '`  RESPONSE: ' + chunk); }.bind(this)); }.bind(this);
        this.api.send_request(target_machine, request_options, callback);
    },
    
    add_trusted_cert : function(target_machine, cert){
        // POST keystore/ca/cert
        var request_options = {
            path : "/keystore/ca/cert",
            method : "POST",
            data : JSON.stringify({"cert" : cert}),
            data_type : "json",
        }
        var callback =  function(res) { res.on('data', function (chunk) {  console.log('ADD TRUSTED CERT TO REMOTE `'+ target_machine + '` RESPONSE: ' + chunk); }.bind(this)); }.bind(this);
        this.api.send_request(target_machine, request_options, callback);
    },
    
    remove_trusted_cert : function(target_machine, cert_id){
        // DELETE keystore/ca/_id
        //var cert_id = "B8:78:BD:23:C5:F1:BA:06:13:97:67:B0:53:93:FC:C2:C5:B0:38:6A";
        var request_options = {
            path : "/keystore/ca/" + cert_id,
            method : "DELETE",
        }
        var callback =  function(res) { res.on('data', function (chunk) {  console.log('REMOVE TRUSTED CERT FROM REMOTE `'+ target_machine + '` RESPONSE: ' + chunk); }.bind(this)); }.bind(this);  
        this.api.send_request(target_machine, request_options, callback);
    },
    
}