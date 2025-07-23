const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const functionsTest = require('firebase-functions-test');
const admin = require('firebase-admin');
const { onLikeCreate } = require('../functions/likes');

(async () => {
  const projectId = 'demo-project';
  const testEnv = await initializeTestEnvironment({ projectId });
  const ft = functionsTest({ projectId });
  const db = testEnv.unauthenticatedContext().firestore();
  const wrapped = ft.wrap(onLikeCreate);

  const snap = ft.firestore.makeDocumentSnapshot({}, 'likes/alice/liked/bob');
  await wrapped(snap, { params: { uid: 'alice', targetUid: 'bob' } });

  const first = await db.doc('likes/bob/likedBy/alice').get();
  if (!first.exists) throw new Error('likedBy missing after first like');
  const firstTime = first.get('createdAt');

  await wrapped(snap, { params: { uid: 'alice', targetUid: 'bob' } });
  const second = await db.doc('likes/bob/likedBy/alice').get();
  const secondTime = second.get('createdAt');

  if (
    firstTime &&
    secondTime &&
    secondTime.toMillis() !== firstTime.toMillis()
  ) {
    throw new Error('likedBy timestamp changed on duplicate like');
  }

  await testEnv.cleanup();
  ft.cleanup();
})();
