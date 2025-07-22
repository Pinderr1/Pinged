const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const functionsTest = require('firebase-functions-test');
const admin = require('firebase-admin');
const { acceptInvite } = require('../functions/invites');

(async () => {
  const testEnv = await initializeTestEnvironment({ projectId: 'demo-project' });
  const ft = functionsTest({ projectId: 'demo-project' });
  const db = testEnv.unauthenticatedContext().firestore();
  const wrapped = ft.wrap(acceptInvite);

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .collection('gameInvites')
      .doc('inv1')
      .set({ from: 'a', to: 'b', status: 'pending', acceptedBy: ['a'] });
  });

  await Promise.all([
    wrapped({ inviteId: 'inv1' }, { auth: { uid: 'b' } }),
    wrapped({ inviteId: 'inv1' }, { auth: { uid: 'b' } }),
  ]);

  const snap = await db.collection('gameInvites').doc('inv1').get();
  const data = snap.data() || {};
  if (data.status !== 'ready') {
    throw new Error('Invite not ready');
  }
  if (!data.gameSessionId) {
    throw new Error('gameSessionId missing');
  }

  const matchId = ['a', 'b'].sort().join('_');
  const matches = await db.collection('matches').get();
  if (matches.size !== 1) {
    throw new Error('Expected one match');
  }
  if (!matches.docs[0] || matches.docs[0].id !== matchId) {
    throw new Error('Incorrect match id');
  }

  await testEnv.cleanup();
  ft.cleanup();
})();
