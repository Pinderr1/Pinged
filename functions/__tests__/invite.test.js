let fetchMock;

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const userGetMock = jest.fn();
admin.firestore = jest.fn(() => ({
  collection: () => ({
    doc: () => ({ get: userGetMock })
  })
}));
admin.initializeApp = jest.fn();

process.env.STRIPE_SECRET_KEY = 'x';

let onGameInviteCreated;

describe('onGameInviteCreated', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock = jest.fn(() => Promise.resolve({ json: () => ({ ok: true }) }));
    global.fetch = fetchMock;
    userGetMock.mockResolvedValue({ data: () => ({ pushToken: 'token' }) });
    onGameInviteCreated = require('../index').onGameInviteCreated;
  });

  it('sends a push notification', async () => {
    const snap = { data: () => ({ to: 'uid2', fromName: 'Bob', gameId: 'g1' }), id: 'invite1' };
    await onGameInviteCreated(snap, {});
    expect(fetchMock).toHaveBeenCalled();
  });
});
