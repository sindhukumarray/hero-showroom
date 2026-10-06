const env = require('./env');
const authConfig = require('./auth');
const corsConfig = require('./corsConfig');
const database = require('./database');

module.exports = {
  ...env,
  authConfig,
  corsConfig,
  database
};
