const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp();

// Import grouped handlers
const payments = require('./payments');
const notifications = require('./notifications');
const invites = require('./invites');

// Re-export all handlers for Firebase deployment
module.exports = {
  ...payments,
  ...(() => {
    const { pushToUser, ...rest } = notifications;
    return rest;
  })(),
  ...invites,
};
