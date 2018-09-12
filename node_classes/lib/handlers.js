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

// Ping handler
handlers.ping = function(data, callback){
  callback(200);
};

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
            'tosAgreement': true
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
// @TODO only let authenticated user access their object
handlers._users.get = function(data, callback){
  // Check if the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
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
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password, tosAgreement
// @TODO only let authenticated user access their object
handlers._users.put = function(data, callback){
  // Check if the phone number is valid
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read('users', phone, function(err, userData){
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
          _data.update('users', phone, userData, function(err){
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
      callback(400, {'Error': 'Missing fields to update.'});
    }
  } else {
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Users - delete
// Required data: phone
// @TODO only let authenticated user access their object
// @TODO clean up (delete) any other data files associated with the user
handlers._users.delete = function(data, callback){
  // Check if the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
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
    callback(400, {'Error': 'Missing the required fields.'});
  }
};

// Not found handler
handlers.notFound = function(data, callback){
  callback(404);
};

module.exports = handlers;
