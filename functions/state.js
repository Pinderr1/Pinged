const functions = require('firebase-functions');
const admin = require('firebase-admin');

const updateMatchState = functions.https.onCall(async (data, context) => {
  const matchId = data?.matchId;
  const activeGameId = data?.activeGameId;
  const pendingInvite = data?.pendingInvite;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!matchId) {
    throw new functions.https.HttpsError('invalid-argument', 'matchId is required');
  }

  const db = admin.firestore();
  const matchRef = db.collection('matches').doc(matchId);
  const matchSnap = await matchRef.get();
  if (!matchSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Match does not exist');
  }
  const users = matchSnap.get('users') || [];
  if (!Array.isArray(users) || !users.includes(uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Not a participant in the match');
  }

  const stateRef = matchRef.collection('state').doc('current');
  const updates = {};
  if (activeGameId !== undefined) updates.activeGameId = activeGameId;
  if (pendingInvite !== undefined) updates.pendingInvite = pendingInvite;

  try {
    await stateRef.set(updates, { merge: true });
    return { success: true };
  } catch (e) {
    console.error('Failed to update match state', e);
    throw new functions.https.HttpsError('internal', 'Failed to update match state');
  }
});

module.exports = { updateMatchState };
