/* config.js
*
* Create and export configuration variables
*/

// Container for all environments
var environments = {};

// Staging environment (default)
environments.staging = {
  'httpPort': 3000,
  'envName': 'staging'
};

// Production environment (default)
environments.production = {
  'httpPort': 5000,
  'envName': 'production'
};

// Determine which environment was passed in command-line
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if the currentEnv is valid (in the list), else uses default
var envExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

// Module to export
module.exports = envExport;
