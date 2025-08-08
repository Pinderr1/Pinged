const admin = require('firebase-admin');
const fs = require('fs');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const { doc, setDoc } = require('firebase/firestore');
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

  it('returns null when users are blocked', async () => {
    const store = {
      'likes/u1/liked/u2': { exists: true },
      'likes/u2/liked/u1': { exists: true },
      'blocks/u1/blocked/u2': { exists: true },
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

    expect(res).toEqual({ matchId: null });
    expect(store['matches/u1_u2']).toBeUndefined();
  });

  it('returns null when likes are not mutual', async () => {
    const store = {
      'likes/u1/liked/u2': { exists: true },
      'likes/u2/liked/u1': { exists: false },
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

    expect(res).toEqual({ matchId: null });
    expect(store['matches/u1_u2']).toBeUndefined();
  });
});

describe('matches security rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'pinged-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  async function seed({ mutual = false, blocked = false } = {}) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      if (mutual) {
        await setDoc(doc(db, 'likes/u1/liked/u2'), {});
        await setDoc(doc(db, 'likes/u2/liked/u1'), {});
      } else {
        await setDoc(doc(db, 'likes/u1/liked/u2'), {});
      }
      if (blocked) {
        await setDoc(doc(db, 'blocks/u1/blocked/u2'), {});
        await setDoc(doc(db, 'blocks/u2/blocked/u1'), {});
      }
    });
  }

  it('denies creating match without mutual likes', async () => {
    await seed({ mutual: false });
    const u1 = testEnv.authenticatedContext('u1');
    const matchRef = doc(u1.firestore(), 'matches/u1_u2');
    const data = { player1: 'u1', player2: 'u2', users: ['u1', 'u2'] };
    await assertFails(setDoc(matchRef, data));
  });

  it('allows creating match with mutual likes', async () => {
    await seed({ mutual: true });
    const u1 = testEnv.authenticatedContext('u1');
    const matchRef = doc(u1.firestore(), 'matches/u1_u2');
    const data = { player1: 'u1', player2: 'u2', users: ['u1', 'u2'] };
    await assertSucceeds(setDoc(matchRef, data));
  });
});
