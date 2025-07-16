const assert = require('assert');

const { firestore, mockFirestore } = require('firebase-admin');
const { syncPresence } = require('../functions/invites');

(async () => {
  const ctx = { params: { uid: 'user1' } };

  // Presence update
  await syncPresence(
    {
      before: { val: () => null },
      after: { val: () => ({ state: 'online', last_changed: 1000 }) },
    },
    ctx,
  );
  assert.deepStrictEqual(mockFirestore._data['user1'], {
    online: true,
    lastOnline: { _ts: 1000 },
  });

  // Presence deletion
  await syncPresence(
    {
      before: { val: () => ({ state: 'offline', last_changed: 2000 }) },
      after: { val: () => null },
    },
    ctx,
  );
  assert.strictEqual(mockFirestore._data['user1'].online, false);
  assert.deepStrictEqual(mockFirestore._data['user1'].lastOnline, { _ts: 2000 });

  console.log('syncPresence tests completed');
})();
