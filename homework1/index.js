/* index.js
*
* RESTful API implementation
*
*/

// Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('./config');

// Instantiating the http server
var httpServer = http.createServer(function(req, res){
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
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });

  // After the end of the stream
  req.on('end', function () {
    buffer += decoder.end();

    // Choose the handler to use
    var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function (statusCode, payload) {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof (payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('** statusCode: ', statusCode);
    });
  });
});

// Start the http server
httpServer.listen(config.httpPort, function(){
  console.log('The HTTP server is listening on the port ' + config.httpPort + ' in mode ' + config.envName);
});

// Define handlers
var handlers = {};

// Hello handler
handlers.hello = function(data, callback){
  callback(200, {'message': 'Welcome to the server!'});
  console.log('The server received a Hello.');
};

// Not found handler
handlers.notFound = function(data, callback){
  callback(404);
  console.log('The handler does not exist.');
};

// Define a request router
var router = {
  'hello': handlers.hello
};
