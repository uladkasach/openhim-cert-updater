var http = require("http")

var options = {
  host: 'www.google.com',
  port: 80,
  path: '/',
  method: 'POST'
};

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

// write data to request body
req.write('data\n');
console.log("first");
req.write('data\n');
console.log("second.");
req.end();