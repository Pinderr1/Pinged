const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const functionsTest = require('firebase-functions-test');
const admin = require('firebase-admin');
const { incrementXp } = require('../functions/stats');

(async () => {
  const testEnv = await initializeTestEnvironment({ projectId: 'demo-project' });
  const ft = functionsTest({ projectId: 'demo-project' });
  const db = testEnv.unauthenticatedContext().firestore();
  const wrapped = ft.wrap(incrementXp);

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('users').doc('u1').set({
      xp: 0,
      streak: 1,
      lastGame: admin.firestore.Timestamp.fromMillis(Date.now() - 23 * 3600 * 1000),
    });
  });

  try {
    await wrapped({ amount: 150 }, { auth: { uid: 'u1' } });
    throw new Error('Should reject large amount');
  } catch (e) {}

  await wrapped({ amount: 50 }, { auth: { uid: 'u1' } });
  let snap = await db.collection('users').doc('u1').get();
  let data = snap.data() || {};
  if (data.xp !== 50) throw new Error('xp not incremented');
  if (data.streak !== 2) throw new Error('streak not increased');

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('users').doc('u1').set({
      xp: 50,
      streak: 2,
      lastGame: admin.firestore.Timestamp.fromMillis(Date.now() - 26 * 3600 * 1000),
    });
  });

  await wrapped({ amount: 20 }, { auth: { uid: 'u1' } });
  snap = await db.collection('users').doc('u1').get();
  data = snap.data() || {};
  if (data.streak !== 1) throw new Error('streak not reset');

  await testEnv.cleanup();
  ft.cleanup();
})();
