/* helpers.js
*
* Helpers for various tasks
*
*/

// Dependencies
var crypto = require('crypto');
var config = require('./config');

// Containers for the helper functions
var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
  if (typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e){
    return {};
  }
};
// Creates a string of alphnumeric characters of a given length
helpers.createRandomString = function (strLength) {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var str = '';
    for (i = 1; i <= strLength; i++) {
      var randomChar = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
      str += randomChar; 
    }
    return str;
  } else {
    return false;
  }
};

// Exporting the module
module.exports = helpers;
