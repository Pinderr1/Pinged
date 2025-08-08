const fs = require('fs');

describe('joinGameSession', () => {
  let admin;
  let joinGameSession;

  const snap = (data) => ({ exists: true, data: () => data });

  function initDb(initial = {}) {
    const store = { ...initial };
    let idCount = 0;

    const sessionsCollection = {
      _col: 'gameSessions',
      where(field, op, value) {
        const query = {
          _col: 'gameSessions',
          filters: [{ field, op, value }],
          where(f, o, v) {
            this.filters.push({ field: f, op: o, value: v });
            return this;
          },
          limit(n) {
            this._limit = n;
            return this;
          },
        };
        return query;
      },
      doc(id) {
        const docId = id || `s${++idCount}`;
        return { id: docId, path: `gameSessions/${docId}` };
      },
    };

    const db = {
      collection: (col) => {
        if (col === 'gameSessions') return sessionsCollection;
        throw new Error(`Unknown collection ${col}`);
      },
      runTransaction: async (fn) => fn(transaction),
    };

    const transaction = {
      async get(ref) {
        if (ref.filters) {
          const entries = Object.entries(store).filter(([p]) =>
            p.startsWith(`${ref._col}/`),
          );
          const matches = entries.filter(([_, s]) => {
            const data = s.data();
            return ref.filters.every(({ field, value }) => {
              if (field === 'players.1') return (data.players || [])[1] === value;
              return data[field] === value;
            });
          });
          const docs = matches
            .slice(0, ref._limit || matches.length)
            .map(([path, s]) => ({
              id: path.split('/')[1],
              data: s.data,
              ref: { path },
            }));
          return { empty: docs.length === 0, docs };
        }
        return store[ref.path] || { exists: false, data: () => ({}) };
      },
      set(ref, data) {
        store[ref.path] = snap(data);
      },
      update(ref, data) {
        const prev = store[ref.path]?.data?.() || {};
        store[ref.path] = snap({ ...prev, ...data });
      },
    };

    return { db, store };
  }

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('firebase-functions', () => ({
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
    jest.doMock('firebase-admin', () => {
      const firestore = jest.fn();
      firestore.FieldValue = { serverTimestamp: jest.fn(() => 'ts') };
      firestore.Timestamp = {
        fromMillis: jest.fn((ms) => ({ toMillis: () => ms })),
      };
      return { firestore };
    });
    admin = require('firebase-admin');
    ({ joinGameSession } = require('../gameSessions'));
  });

  it('joins existing waiting session', async () => {
    const { db, store } = initDb({
      'gameSessions/sess1': snap({
        gameId: 'g1',
        players: ['u1', null],
        status: 'waiting',
      }),
    });
    admin.firestore.mockReturnValue(db);

    const res = await joinGameSession(
      { gameId: 'g1' },
      { auth: { uid: 'u2' } },
    );

    expect(res).toEqual({ sessionId: 'sess1', opponentId: 'u1' });
    const updated = store['gameSessions/sess1'].data();
    expect(updated).toMatchObject({
      players: ['u1', 'u2'],
      status: 'active',
    });
  });

  it('creates new waiting session when none exists', async () => {
    const { db, store } = initDb();
    admin.firestore.mockReturnValue(db);

    const res = await joinGameSession(
      { gameId: 'g1' },
      { auth: { uid: 'u1' } },
    );

    expect(res.opponentId).toBeNull();
    const sess = store[`gameSessions/${res.sessionId}`].data();
    expect(sess).toMatchObject({
      gameId: 'g1',
      players: ['u1', null],
      status: 'waiting',
    });
  });

  it('rejects unauthenticated requests', async () => {
    await expect(joinGameSession({ gameId: 'g1' }, {})).rejects.toHaveProperty(
      'code',
      'unauthenticated',
    );
  });
});

describe('gameSessions security rules', () => {
  let testEnv;
  let initializeTestEnvironment;
  let assertSucceeds;
  let assertFails;
  let doc;
  let setDoc;
  let getDoc;
  let updateDoc;
  const matchId = 'alice_bob';

  beforeAll(async () => {
    jest.resetModules();
    ({ initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing'));
    ({ doc, setDoc, getDoc, updateDoc } = require('firebase/firestore'));
    testEnv = await initializeTestEnvironment({
      projectId: 'pinged-test',
      firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  async function seedMatch() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/alice'), { matchedUsers: ['bob'] });
      await setDoc(doc(db, 'users/bob'), { matchedUsers: ['alice'] });
      await setDoc(doc(db, `matches/${matchId}`), { users: ['alice', 'bob'] });
    });
  }

  test('only match participants can read/write sessions', async () => {
    await seedMatch();
    const alice = testEnv.authenticatedContext('alice');
    const bob = testEnv.authenticatedContext('bob');
    const carol = testEnv.authenticatedContext('carol');

    const sessionData = { sessionMatchId: matchId };

    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'gameSessions/s1'), sessionData),
    );
    await assertSucceeds(
      getDoc(doc(bob.firestore(), 'gameSessions/s1')),
    );
    await assertSucceeds(
      updateDoc(doc(bob.firestore(), 'gameSessions/s1'), { move: 'X' }),
    );

    await assertFails(getDoc(doc(carol.firestore(), 'gameSessions/s1')));
    await assertFails(
      setDoc(doc(carol.firestore(), 'gameSessions/s2'), sessionData),
    );
    await assertFails(
      updateDoc(doc(carol.firestore(), 'gameSessions/s1'), { move: 'O' }),
    );
  });
});

