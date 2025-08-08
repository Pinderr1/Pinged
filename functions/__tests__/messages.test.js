const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { sendChatMessage } = require('../messages');

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
  firestore.Timestamp = { fromMillis: (ms) => ({ toMillis: () => ms }) };
  return { firestore };
});

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
      doc: (id) => docRef(`${col}/${id}`),
      add: async (data) => {
        const id = `doc${++idCount}`;
        store[`${col}/${id}`] = snap(data);
        return { id };
      },
    }),
    runTransaction: async (fn) => fn(transaction),
  };

  function docRef(path) {
    return {
      path,
      get: async () => store[path] || { exists: false, data: () => ({}), get: () => undefined },
      set: async (data, options) => {
        const prev = store[path]?.data?.() || {};
        store[path] = snap(options?.merge ? { ...prev, ...data } : data);
      },
      update: async (data) => {
        const prev = store[path]?.data?.() || {};
        store[path] = snap({ ...prev, ...data });
      },
      collection: (sub) => ({
        doc: (id) => docRef(`${path}/${sub}/${id}`),
        add: async (data) => {
          const id = `doc${++idCount}`;
          store[`${path}/${sub}/${id}`] = snap(data);
          return { id };
        },
      }),
    };
  }

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

describe('sendChatMessage', () => {
  beforeEach(() => {
    admin.firestore.mockReset();
  });

  it('rate limits messages per match', async () => {
    const { db } = initDb({
      'matches/m1': snap({ users: ['u1', 'u2'] }),
    });
    admin.firestore.mockReturnValue(db);

    const spy = jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(500);

    await sendChatMessage({ matchId: 'm1', message: { text: 'hi' } }, { auth: { uid: 'u1' } });
    await expect(
      sendChatMessage({ matchId: 'm1', message: { text: 'again' } }, { auth: { uid: 'u1' } }),
    ).rejects.toHaveProperty('code', 'resource-exhausted');

    spy.mockRestore();
  });

  it('allows rapid messages to different matches', async () => {
    const { db, store } = initDb({
      'matches/m1': snap({ users: ['u1', 'u2'] }),
      'matches/m2': snap({ users: ['u1', 'u3'] }),
    });
    admin.firestore.mockReturnValue(db);
    const spy = jest.spyOn(Date, 'now').mockReturnValue(0);

    await sendChatMessage({ matchId: 'm1', message: { text: 'hi1' } }, { auth: { uid: 'u1' } });
    await sendChatMessage({ matchId: 'm2', message: { text: 'hi2' } }, { auth: { uid: 'u1' } });

    expect(store['matches/m1/messages/doc1']).toBeDefined();
    expect(store['matches/m2/messages/doc2']).toBeDefined();

    spy.mockRestore();
  });
});
