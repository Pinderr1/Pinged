const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const functionsTest = require('firebase-functions-test');
const admin = require('firebase-admin');
const { incrementXp } = require('../functions/stats');

(async () => {
  const projectId = 'demo-project';
  const testEnv = await initializeTestEnvironment({ projectId });
  const ft = functionsTest({ projectId });
  const db = testEnv.unauthenticatedContext().firestore();
  const wrapped = ft.wrap(incrementXp);

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('users').doc('alice').set({
      xp: 0,
      streak: 1,
      lastPlayedAt: admin.firestore.Timestamp.fromMillis(Date.now() - 23 * 3600 * 1000),
    });
    await ctx.firestore().collection('users').doc('bob').set({
      xp: 0,
      streak: 5,
      lastPlayedAt: admin.firestore.Timestamp.fromMillis(Date.now() - 26 * 3600 * 1000),
    });
  });

  await wrapped({ amount: 20 }, { auth: { uid: 'alice' } });
  let snap = await db.collection('users').doc('alice').get();
  let data = snap.data();
  if (data.xp !== 20) throw new Error('XP not incremented');
  if (data.streak !== 2) throw new Error('Streak not incremented');

  await wrapped({ amount: 10 }, { auth: { uid: 'bob' } });
  snap = await db.collection('users').doc('bob').get();
  data = snap.data();
  if (data.xp !== 10) throw new Error('XP not updated');
  if (data.streak !== 5) throw new Error('Streak should not increase');

  let error = null;
  try {
    await wrapped({ amount: 101 }, { auth: { uid: 'alice' } });
  } catch (e) {
    error = e;
  }
  if (!error) throw new Error('Allowed too much XP');

  await testEnv.cleanup();
  ft.cleanup();
})();
