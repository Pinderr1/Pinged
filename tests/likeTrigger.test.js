const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const functionsTest = require('firebase-functions-test');
const admin = require('firebase-admin');
const { onLikeCreate } = require('../functions/likes');

(async () => {
  const testEnv = await initializeTestEnvironment({ projectId: 'demo-project' });
  const ft = functionsTest({ projectId: 'demo-project' });
  const db = testEnv.unauthenticatedContext().firestore();
  const wrapped = ft.wrap(onLikeCreate);

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('likes/alice/liked/bob').set({});
  });

  const snap = ft.firestore.makeDocumentSnapshot({}, 'likes/alice/liked/bob');
  await wrapped(snap, { params: { uid: 'alice', targetUid: 'bob' } });

  const first = await db.doc('likes/bob/likedBy/alice').get();
  if (!first.exists) {
    throw new Error('likedBy doc missing');
  }
  const firstTime = first.get('createdAt');

  await wrapped(snap, { params: { uid: 'alice', targetUid: 'bob' } });
  const second = await db.doc('likes/bob/likedBy/alice').get();
  const secondTime = second.get('createdAt');

  if (!firstTime || !secondTime || firstTime.toMillis() !== secondTime.toMillis()) {
    throw new Error('Trigger not idempotent');
  }

  await testEnv.cleanup();
  ft.cleanup();
})();
