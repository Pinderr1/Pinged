import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as functionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import { createMatchIfMutualLike } from '../functions/src/match';

(async () => {
  const testEnv = await initializeTestEnvironment({ projectId: 'demo-project' });
  const ft = functionsTest({ projectId: 'demo-project' });
  const db = testEnv.unauthenticatedContext().firestore();

  const wrapped = ft.wrap(createMatchIfMutualLike);

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('likes').doc('a').collection('liked').doc('b').set({});
    await ctx.firestore().collection('likes').doc('b').collection('liked').doc('a').set({});
  });

  const [resA, resB] = await Promise.all([
    wrapped({ uid: 'a', targetUid: 'b' }, { auth: { uid: 'a' } }),
    wrapped({ uid: 'b', targetUid: 'a' }, { auth: { uid: 'b' } }),
  ]);

  const matchId = resA.data?.matchId || resB.data?.matchId;
  if (matchId !== 'a_b') {
    throw new Error(`Unexpected matchId ${matchId}`);
  }

  const matches = await db.collection('matches').get();
  if (matches.size !== 1) {
    throw new Error('Expected exactly one match');
  }

  const snap = await db.collection('matches').doc(matchId).get();
  const users = snap.get('users') || [];
  if (!(users.includes('a') && users.includes('b'))) {
    throw new Error('Match document missing users');
  }

  await testEnv.cleanup();
  ft.cleanup();
})();
