const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const functionsTest = require('firebase-functions-test');
const fs = require('fs');
const { onLikeCreate } = require('../functions/likes');

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
  const ft = functionsTest({ projectId: 'demo-project' });
  const db = testEnv.unauthenticatedContext().firestore();
  const wrapped = ft.wrap(onLikeCreate);

  // invoke trigger twice to verify idempotence
  const snap = ft.firestore.makeDocumentSnapshot({}, 'likes/alice/liked/bob');
  await wrapped(snap, { params: { uid: 'alice', targetUid: 'bob' } });
  await wrapped(snap, { params: { uid: 'alice', targetUid: 'bob' } });

  const likedByDoc = await db.doc('likes/bob/likedBy/alice').get();
  if (!likedByDoc.exists) {
    throw new Error('likedBy doc not created');
  }

  await testEnv.cleanup();
  ft.cleanup();
})();
