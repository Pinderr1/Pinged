const functions = require('firebase-functions');
const admin = require('firebase-admin');

async function createMatchIfMutualLikeInternal(data, context, tx) {
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

  const run = async (transaction) => {
    const matchRef = db.collection('matches').doc(matchId);
    const matchSnap = await transaction.get(matchRef);
    if (matchSnap.exists) {
      return { matchId };
    }

    const [like1, like2] = await Promise.all([
      transaction.get(db.collection('likes').doc(uid).collection('liked').doc(targetUid)),
      transaction.get(db.collection('likes').doc(targetUid).collection('liked').doc(uid)),
    ]);

    if (like1.exists && like2.exists) {
      transaction.set(matchRef, {
        users: sorted,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { matchId };
    }

    return { matchId: null };
  };

  try {
    if (tx) {
      return await run(tx);
    }
    return await db.runTransaction(run);
  } catch (e) {
    console.error('Failed to create match', e);
    throw new functions.https.HttpsError('internal', 'Failed to create match');
  }
}

const createMatchIfMutualLike = functions.https.onCall((data, context) =>
  createMatchIfMutualLikeInternal(data, context),
);

module.exports = { createMatchIfMutualLike, createMatchIfMutualLikeInternal };
