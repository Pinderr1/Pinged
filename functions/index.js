const invites = require('./invites');
const payments = require('./payments');
const notifications = require('./notifications');

module.exports = {
  ...payments,
  ...notifications,
  ...invites,
};
