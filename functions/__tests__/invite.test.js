jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({ checkout: { sessions: { create: jest.fn() } } }));
});

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ data: () => ({ expoPushToken: 'token' }) })
  }))
}));

const functions = require('../index');

describe('onGameInviteCreated', () => {
  it('sends a push notification when invite is created', async () => {
    const pushSpy = jest.spyOn(functions._test, 'pushToUser').mockResolvedValue(null);

    const data = { to: 'user2', fromName: 'Alice', gameId: 'game123' };
    const snap = { id: 'invite1', data: () => data };

    await functions.onGameInviteCreated(snap, {});

    expect(pushSpy).toHaveBeenCalledWith(
      'user2',
      'Game Invite',
      'Alice invited you to play',
      { type: 'invite', inviteId: 'invite1', gameId: 'game123' }
    );
  });
});
