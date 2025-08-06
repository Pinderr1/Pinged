const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { sendInvite, acceptInvite } = require('../invites');
const { createMatchIfMutualLikeInternal } = require('../src/match');

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

jest.mock('../src/match', () => ({
  createMatchIfMutualLikeInternal: jest.fn(() => ({ matchId: 'u1_u2' })),
}));

const snap = (data) => ({
  exists: true,
  data: () => data,
  get: (field) => data[field],
});

function initDb(initial = {}) {
  const store = { ...initial };
  let idCount = 0;

  const db = {
    collection: (col) => ({
      doc: (id) => ({
        path: `${col}/${id}`,
        get: async () => store[`${col}/${id}`] || { exists: false, data: () => ({}), get: () => undefined },
        set: async (data, options) => {
          const prev = store[`${col}/${id}`]?.data?.() || {};
          store[`${col}/${id}`] = snap(options?.merge ? { ...prev, ...data } : data);
        },
        update: async (data) => {
          const prev = store[`${col}/${id}`]?.data?.() || {};
          store[`${col}/${id}`] = snap({ ...prev, ...data });
        },
        collection: (sub) => ({
          doc: (sid) => ({ path: `${col}/${id}/${sub}/${sid}` }),
        }),
      }),
      add: async (data) => {
        const id = `inv${++idCount}`;
        store[`${col}/${id}`] = snap(data);
        return { id };
      },
    }),
    runTransaction: async (fn) => fn(transaction),
  };

  const transaction = {
    get: async (ref) => store[ref.path] || { exists: false, data: () => ({}), get: () => undefined },
    set: (ref, data) => {
      store[ref.path] = snap(data);
    },
    update: (ref, data) => {
      const prev = store[ref.path]?.data?.() || {};
      store[ref.path] = snap({ ...prev, ...data });
    },
  };

  return { db, store };
}

describe('sendInvite', () => {
  beforeEach(() => {
    admin.firestore.mockReset();
  });

  it('allows authenticated user to invite a matched user', async () => {
    const { db, store } = initDb({
      'matches/u1_u2': snap({ users: ['u1', 'u2'] }),
    });
    admin.firestore.mockReturnValue(db);

    const res = await sendInvite({ to: 'u2', gameId: 'g1' }, { auth: { uid: 'u1' } });

    expect(res.inviteId).toBeDefined();
    const invite = store[`gameInvites/${res.inviteId}`].data();
    expect(invite).toMatchObject({
      from: 'u1',
      to: 'u2',
      gameId: 'g1',
      status: 'pending',
      acceptedBy: ['u1'],
    });
    expect(store['inviteMeta/u1'].data()).toHaveProperty('lastInviteAt', 'ts');
  });

  it('throws when inviting oneself', async () => {
    const { db } = initDb();
    admin.firestore.mockReturnValue(db);

    await expect(
      sendInvite({ to: 'u1', gameId: 'g1' }, { auth: { uid: 'u1' } }),
    ).rejects.toHaveProperty('code', 'invalid-argument');
  });

  it('throws when invites are sent too frequently', async () => {
    const { db } = initDb({
      'inviteMeta/u1': snap({ lastInviteAt: { toMillis: () => Date.now() } }),
    });
    admin.firestore.mockReturnValue(db);

    await expect(
      sendInvite({ to: 'u2', gameId: 'g1' }, { auth: { uid: 'u1' } }),
    ).rejects.toHaveProperty('code', 'resource-exhausted');
  });
});

describe('acceptInvite', () => {
  beforeEach(() => {
    admin.firestore.mockReset();
    createMatchIfMutualLikeInternal.mockClear();
  });

  it('only allows participants to accept', async () => {
    const { db } = initDb({
      'gameInvites/inv1': snap({
        from: 'u1',
        to: 'u2',
        gameId: 'g1',
        acceptedBy: ['u1'],
        status: 'pending',
      }),
    });
    admin.firestore.mockReturnValue(db);

    await expect(
      acceptInvite({ inviteId: 'inv1' }, { auth: { uid: 'u3' } }),
    ).rejects.toHaveProperty('code', 'permission-denied');
  });

  it('creates session and marks ready when both accept', async () => {
    const { db, store } = initDb({
      'gameInvites/inv1': snap({
        from: 'u1',
        to: 'u2',
        gameId: 'g1',
        acceptedBy: ['u1'],
        status: 'pending',
      }),
    });
    admin.firestore.mockReturnValue(db);

    const res = await acceptInvite({ inviteId: 'inv1' }, { auth: { uid: 'u2' } });

    const invite = store['gameInvites/inv1'].data();
    expect(invite).toMatchObject({
      status: 'ready',
      gameSessionId: 'inv1',
      acceptedBy: ['u1', 'u2'],
    });
    expect(store['gameSessions/inv1']).toBeDefined();
    expect(store['gameSessions/inv1'].data()).toMatchObject({ playersCount: 2 });
    expect(res).toEqual({ matchId: 'u1_u2' });
    expect(createMatchIfMutualLikeInternal).toHaveBeenCalled();
  });
});

