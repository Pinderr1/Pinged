const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { sendLike } = require('../likes');

jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
    onCall: (fn) => fn,
  },
}));

jest.mock('firebase-admin', () => {
  const firestore = jest.fn();
  firestore.FieldValue = { serverTimestamp: jest.fn(() => 'ts') };
  return { firestore };
});

describe('likeAndMaybeMatch', () => {
  it('creates match when other user liked first', async () => {
    const store = {
      'config/app': { exists: true, data: { maxDailyLikes: 100 } },
      'users/u1': { exists: true, data: { isPremium: true } },
      'likes/u2/liked/u1': { exists: true },
      'likes/u1/liked/u2': { exists: false },
      'blocks/u1/blocked/u2': { exists: false },
      'blocks/u2/blocked/u1': { exists: false },
      'matches/u1_u2': { exists: false },
    };

    const db = {
      collection: (col) => ({
        doc: (id) => ({
          path: `${col}/${id}`,
          collection: (sub) => ({
            doc: (sid) => ({ path: `${col}/${id}/${sub}/${sid}` }),
          }),
          get: async () => store[`${col}/${id}`] || { exists: false, data: () => ({}) },
        }),
      }),
      runTransaction: (fn) => fn(transaction),
    };

    const transaction = {
      get: async (ref) => store[ref.path] || { exists: false },
      set: (ref, data) => {
        store[ref.path] = { exists: true, data };
      },
    };

    admin.firestore.mockReturnValue(db);

    const res = await sendLike(
      { targetUid: 'u2' },
      { auth: { uid: 'u1' } }
    );

    expect(res).toEqual({ matchId: 'u1_u2' });
    expect(store['likes/u1/liked/u2']).toBeDefined();
    expect(store['matches/u1_u2']).toBeDefined();
  });
});
