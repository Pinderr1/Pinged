const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing');
const admin = require('firebase-admin');
const fs = require('fs');

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
  });

  const getDb = (uid) => testEnv.authenticatedContext(uid).firestore();

  await testEnv.clearFirestore();

  const seed = async (cb) => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await cb(ctx.firestore());
    });
  };

  await seed(async (db) => {
    await db.collection('users').doc('alice').set({ uid: 'alice', location: 'NY' });
    await db.collection('users').doc('bob').set({ uid: 'bob', location: 'NY' });
    await db.collection('blocks').doc('alice').collection('blocked').doc('bob').set({ blockedAt: 1 });
    await db.collection('blocks').doc('bob').collection('blocked').doc('alice').set({ blockedAt: 1 });
  });

  const aliceDb = getDb('alice');
  const snap = await aliceDb
    .collection('users')
    .where(admin.firestore.FieldPath.documentId(), 'not-in', ['bob'])
    .get();
  if (snap.docs.some((d) => d.id === 'bob')) {
    throw new Error('Blocked user returned in query');
  }

  await assertFails(
    aliceDb.collection('likes').doc('alice').collection('liked').doc('bob').set({})
  );

  await seed(async (db) => {
    const aBlock = await db.doc('blocks/alice/blocked/bob').get();
    const bBlock = await db.doc('blocks/bob/blocked/alice').get();
    if (!aBlock.exists || !bBlock.exists) {
      throw new Error('Mirror block missing');
    }
  });

  await testEnv.cleanup();
})();
