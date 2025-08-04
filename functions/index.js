const functions = require('firebase-functions');
const admin = require('firebase-admin');
// Load environment variables from root .env file without external packages
require('../loadEnv.js');

admin.initializeApp();

// Import grouped handlers
const payments = require('./payments');
const notifications = require('./notifications');
const invites = require('./invites');
const blocks = require('./blocks');
const stats = require('./stats');
const likes = require('./likes');
const gameSessions = require('./gameSessions');
const events = require('./events');
const messages = require('./messages');
const cleanup = require('./cleanup');
const premium = require('./premium');

// Re-export all handlers for Firebase deployment
module.exports = {
  ...payments,
  ...(() => {
    const { pushToUser, ...rest } = notifications;
    return rest;
  })(),
  ...invites,
  ...blocks,
  ...stats,
  ...likes,
  ...gameSessions,
  ...events,
  ...messages,
  ...cleanup,
  ...premium,
};
