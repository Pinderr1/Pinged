const functions = require('firebase-functions');
const admin = require('firebase-admin');

const createMatchIfMutualLike = functions.https.onCall(async (data, context) => {
  const { uid, targetUid } = data || {};

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!uid || !targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and targetUid are required');
  }
  if (context.auth.uid !== uid && !context.auth.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot create match for another user');
  }

  const db = admin.firestore();
  const sorted = [uid, targetUid].sort();
  const matchId = sorted.join('_');

  try {
    return await db.runTransaction(async (tx) => {
      const matchRef = db.collection('matches').doc(matchId);
      const matchSnap = await tx.get(matchRef);
      if (matchSnap.exists) {
        return { matchId };
      }

      const [like1, like2] = await Promise.all([
        tx.get(db.collection('likes').doc(uid).collection('liked').doc(targetUid)),
        tx.get(db.collection('likes').doc(targetUid).collection('liked').doc(uid)),
      ]);

      if (like1.exists && like2.exists) {
        tx.set(matchRef, {
          users: sorted,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { matchId };
      }

      return { matchId: null };
    });
  } catch (e) {
    console.error('Failed to create match', e);
    throw new functions.https.HttpsError('internal', 'Failed to create match');
  }
});

module.exports = { createMatchIfMutualLike };
