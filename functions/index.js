const functions = require('firebase-functions');
const admin = require('firebase-admin');
// Load environment variables from root .env file without external packages
require('../loadEnv.js');

admin.initializeApp();

// Import grouped handlers
const payments = require('./payments');
const notifications = require('./notifications');
const invites = require('./invites');
const match = require('./src/match');
const blocks = require('./blocks');
const matches = require('./matches');
const stats = require('./stats');
const likes = require('./likes');

// Re-export all handlers for Firebase deployment
module.exports = {
  ...payments,
  ...(() => {
    const { pushToUser, ...rest } = notifications;
    return rest;
  })(),
  ...invites,
  ...match,
  ...matches,
  ...blocks,
  ...stats,
  ...likes,
};
