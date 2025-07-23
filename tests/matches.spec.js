const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const functionsTest = require('firebase-functions-test');
const admin = require('firebase-admin');
const { createMatch } = require('../functions/matches');

(async () => {
  const testEnv = await initializeTestEnvironment({ projectId: 'demo-project' });
  const ft = functionsTest({ projectId: 'demo-project' });
  const db = testEnv.unauthenticatedContext().firestore();
  const wrapped = ft.wrap(createMatch);

  // Block check
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('blocks/a/blocked/b').set({});
  });

  try {
    await wrapped({ opponentUid: 'b' }, { auth: { uid: 'a' } });
    throw new Error('Should have failed');
  } catch (e) {
    if (e.code !== 'permission-denied') throw e;
  }

  // Duplicate creation
  const [resA, resB] = await Promise.all([
    wrapped({ opponentUid: 'b' }, { auth: { uid: 'a' } }),
    wrapped({ opponentUid: 'a' }, { auth: { uid: 'b' } }),
  ]);

  const matchId = resA.data.matchId || resB.data.matchId;
  if (matchId !== 'a_b') throw new Error('Unexpected matchId ' + matchId);
  const snap = await db.collection('matches').get();
  if (snap.size !== 1) throw new Error('Expected one match document');

  await testEnv.cleanup();
  ft.cleanup();
})();
