const assert = require('assert');
const admin = require('firebase-admin');
const { syncPresence } = require('../functions/invites');

let lastSet = null;

admin.firestore = () => ({
  collection: () => ({
    doc: () => ({
      set: async (data, opts) => {
        lastSet = { data, opts };
      },
    }),
  }),
  Timestamp: {
    fromMillis: (ms) => ({ ms }),
  },
  FieldValue: {
    serverTimestamp: () => 'serverTimestamp',
  },
});

function snap(val) {
  return { val: () => val };
}

(async () => {
  await syncPresence({ before: snap(null), after: snap({ state: 'online', last_changed: 1 }) }, { params: { uid: 'u1' } });
  assert.deepStrictEqual(lastSet, {
    data: { online: true, lastOnline: { ms: 1 } },
    opts: { merge: true },
  });

  await syncPresence({ before: snap({ state: 'online', last_changed: 2 }), after: snap(null) }, { params: { uid: 'u1' } });
  assert.deepStrictEqual(lastSet, {
    data: { online: false, lastOnline: { ms: 2 } },
    opts: { merge: true },
  });

  console.log('presence sync tests completed');
})();
