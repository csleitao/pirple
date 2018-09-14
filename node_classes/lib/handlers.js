/* handlers.js
*
* Request handlers
*
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define handlers
var handlers = {};

// Users handler
handlers.users = function(data, callback){
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for Users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
  // Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    _data.read('users', phone, function(err, data){
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // Create the user object
          var userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'password': password,
            'tosAgreement': true,
            'hashedPassword': helpers.hash(password)
          };

          // Store the user
          _data.create('users', phone, userObject, function(err){
            if (!err) {
              callback(200);
            } else {
              callback(400, {'Error': 'Could not create the new user.'});
            }
          });
        } else {
          callback(500, {'Error': 'Could not hash the phone number.'});
        }
      } else {
        callback(400, {'Error': 'A user with that phone number already exists.'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback){
  // Check if the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // get the token from headers
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
      if (tokenIsValid) {
        _data.read('users', phone, function(err, data){
          if (!err && data) {
            // Remove the hashed password from the user object before returning it
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token in header or invalid.'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password, tosAgreement
handlers._users.put = function(data, callback){
  // Check if the phone number is valid
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone) {
    if (firstName || lastName || password) {
      // get the token from headers
      var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token, phone, function (tokenIsValid){
        if (tokenIsValid) {
          // lookup the user
          _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
              // update the fields
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users', phone, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error': 'Could not update the user.'});
                }
              });
            } else {
              callback(400, {'Error': 'The user does not exist.'});
            }
          });
        } else {
          callback(403, {'Error': 'Missing required token in header or invalid.'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing fields to update.'});
    }
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Users - delete
// Required data: phone
// @TODO clean up (delete) any other data files associated with the user
handlers._users.delete = function(data, callback){
  // Check if the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // get the token from headers
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function(err, data){
          if (!err && data) {
            _data.delete('users', phone, function(err){
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {'Error': 'Could not delete the user.'});
                }
            });
          } else {
            callback(400, {'Error': 'The user does not exist.'});
          }
        });
      } else {
        callback(403, {
          'Error': 'Missing required token in header or invalid.'
        });
      }
    });
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Tokens handler
handlers.tokens = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback){
  // Check that all required fields are filled out
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    // Lookup the user who matches the phone number
    _data.read('users', phone, function(err, userData){
      if (!err && userData) {
        // Hash the sent password, and compare it 
        var hashedPassword = helpers.hash(password);
        
        //console.log("password: ", password);
        //console.log("hashedPassword: ", hashedPassword);
        //console.log("userData.hashedPassword: ", userData.hashedPassword);
        //console.log("userData: ", userData);

        
        if (hashedPassword == userData.hashedPassword) {
          // Create a new token with a random name. exp date +1 hour
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60; // 1000 ms * 3600 s
          var tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          };
          // store token
          _data.create('tokens', tokenId, tokenObject, function(err){
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not create new token.'});
            }
          });
        } else {
          callback(400, {'Error': 'Password did not match.'});
        }
      } else {
        callback(400, {'Error': 'Could not find the user.'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
  // Check if the phone number is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, {'Error': 'Token not found.'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend ? true : false;
  if (id && extend) {
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          _data.update('tokens', id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error': 'Could not update token expiration.'});
            }
          });
        } else {
           callback(404, {'Error': 'Token already expired.'});
        }
      } else {
        callback(404, {'Error': 'Token not found.'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, function(err, tokenData){
      if (!err && tokenData) {
        _data.delete('tokens', id, function(err){
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete token.'});
          }
        });
      } else {
        callback(400, {'Error': 'Token not found.'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
  _data.read('tokens', id, function (err, tokenData){
    if (!err && tokenData) {
      // check token is valid
      if (tokenData.phone == phone && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Ping handler
handlers.ping = function (data, callback){
  callback(200);
};

// Not found handler
handlers.notFound = function(data, callback){
  callback(404);
};

module.exports = handlers;






