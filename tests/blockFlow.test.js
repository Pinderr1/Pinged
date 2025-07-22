const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
  });

  const getDb = (uid, token = {}) => testEnv.authenticatedContext(uid, token).firestore();
  await testEnv.clearFirestore();

  const seed = async (cb) => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await cb(ctx.firestore());
    });
  };

  try {
    await seed(async (db) => {
      await db.collection('users').doc('alice').set({ uid: 'alice', age: 25 });
      await db.collection('users').doc('bob').set({ uid: 'bob', age: 26 });
      // Simulate block with mirror entry
      await db.collection('blocks').doc('alice').collection('blocked').doc('bob').set({ blockedAt: 1 });
      await db.collection('blocks').doc('bob').collection('blocked').doc('alice').set({ blockedAt: 1 });
    });

    const aliceDb = getDb('alice');
    const bobDb = getDb('bob');

    const resA = await aliceDb.collection('users').get();
    if (resA.docs.some((d) => d.id === 'bob')) {
      throw new Error('Blocked user surfaced for blocker');
    }

    const resB = await bobDb.collection('users').get();
    if (resB.docs.some((d) => d.id === 'alice')) {
      throw new Error('Blocker surfaced for blocked user');
    }

    await assertFails(
      aliceDb.collection('likes').doc('alice').collection('liked').doc('bob').set({})
    );
    await assertFails(
      bobDb.collection('likes').doc('bob').collection('liked').doc('alice').set({})
    );
  } finally {
    await testEnv.cleanup();
  }
})();
