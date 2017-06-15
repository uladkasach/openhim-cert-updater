module.exports = {
    http : require("http"),
    https : require("https"),
    
    send_request(request_options, callback){
        //////////////
        // define request options
        //////////////
        /*
            request_options = {
                host: 'www.google.com',
                port: 80,
                path: '/upload',
                method: 'POST',
                additional_headers : "",
            }
        */
        
        
        /////////////
        // Validate request options
        /////////////
        // request type
        var request_method = request_options.method;
        if(["POST", "GET"].indexOf(request_method) == -1){
            console.error("request method (" + request_method + ") is not valid for request_handler.send_request.");
            return false;
        }
        // secure type
        var use_ssl = (request_options.use_ssl === true) ? true : false; // if not true then false
        
        ////////////
        // send request
        ////////////
        var protocall = (use_ssl) ? this.https : this.http;
        var options = {
            host: request_options.host,
            port: request_options.port,
            path: request_options.path,
            method: request_options.method,
            headers : request_options.headers,
            rejectUnauthorized: false,
        };
        //console.log(options);
        //console.log(request_options.data);
        var error_function = function(e){console.log('ERROR: ' + e.message); console.log(e); };
        var req = protocall.request(options, callback).on('error', error_function);
        if(request_options.method == "POST") req.write(request_options.data);
        req.end();
        //req.end();
        /*
            callback = function(res) {
              console.log('STATUS: ' + res.statusCode);
              console.log('HEADERS: ' + JSON.stringify(res.headers));
              res.setEncoding('utf8');
              res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
              });
            }
        */
    }
}