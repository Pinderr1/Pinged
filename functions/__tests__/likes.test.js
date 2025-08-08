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
  firestore.Timestamp = { now: jest.fn(() => ({ toDate: () => new Date('2020-01-01') })) };
  return { firestore };
});

describe('sendLike', () => {
  it('creates match when other user liked first', async () => {
    const snap = (data) => ({
      exists: true,
      data: () => data,
      get: (field) => data[field],
    });
    const store = {
      'config/app': snap({ maxDailyLikes: 100, resetHour: 0, timezonePolicy: 'utc', enforceLimitsServerSide: true }),
      'users/u1': snap({ isPremium: true }),
      'likes/u2/liked/u1': snap({}),
      'likes/u1/liked/u2': { exists: false, data: () => ({}) },
      'blocks/u1/blocked/u2': { exists: false, data: () => ({}) },
      'blocks/u2/blocked/u1': { exists: false, data: () => ({}) },
      'matches/u1_u2': { exists: false, data: () => ({}) },
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
      get: async (ref) => store[ref.path] || { exists: false, data: () => ({}) },
      set: (ref, data) => {
        store[ref.path] = snap(data);
      },
      update: (ref, data) => {
        const prev = store[ref.path]?.data?.() || {};
        store[ref.path] = snap({ ...prev, ...data });
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
