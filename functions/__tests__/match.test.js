const admin = require('firebase-admin');
const { createMatchIfMutualLikeInternal } = require('../src/match');

jest.mock('firebase-admin', () => {
  const firestore = jest.fn();
  firestore.FieldValue = { serverTimestamp: jest.fn(() => 'ts') };
  return { firestore };
});

describe('createMatchIfMutualLikeInternal', () => {
  it('creates a match when likes are mutual', async () => {
    const store = {
      'likes/u1/liked/u2': { exists: true },
      'likes/u2/liked/u1': { exists: true },
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

    const res = await createMatchIfMutualLikeInternal(
      { uid: 'u1', targetUid: 'u2' },
      { auth: { uid: 'u1' } }
    );

    expect(res).toEqual({ matchId: 'u1_u2' });
    expect(store['matches/u1_u2']).toBeDefined();
  });
});
