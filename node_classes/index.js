/* index.js
*
* RESTful API implementation
*
*/

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('./lib/config');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

// Instantiating the http server
var httpServer = http.createServer(function(req, res){
  unifiedServer(req, res);
});

// Start the http server
httpServer.listen(config.httpPort, function(){
  console.log('The HTTP server is listening on the port ' + config.httpPort + ' in mode ' + config.envName);
});

// Instantiating the https server
var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions, function(req, res){
  unifiedServer(req, res);
});

// Start the https server
httpsServer.listen(config.httpsPort, function(){
  console.log('The HTTPS server is listening on the port ' + config.httpsPort + ' in mode ' + config.envName);
});

// All the server logic for both http and https servers
var unifiedServer = function(req, res){
  // Get the URL and parse it
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  // Get the headers as an queryStringObject
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');

  // Receives the stream and decode it
  var buffer = '';
  req.on('data', function(data){
    buffer += decoder.write(data);
  });

  // After the end of the stream
  req.on('end', function(){
    buffer += decoder.end();

    // Choose the handler to use
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload){
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('** statusCode: ', statusCode);
      console.log('** payloadString: ', payloadString);
    });

/*
    // Log the request path
    console.log('++++ Request ++++');
    console.log('-- path: ' + trimmedPath);
    console.log('-- method: ' + method);
    console.log('-- query: ', queryStringObject);
    console.log('-- headers: ', headers);
    console.log('-- buffer: ', buffer);
    console.log('++++ (End) ++++'); */
  });
};

// Define a request router
var router = {
  'ping': handlers.ping,
  'users': handlers.users
};