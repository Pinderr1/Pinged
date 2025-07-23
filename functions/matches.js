const functions = require('firebase-functions');
const admin = require('firebase-admin');

const createMatch = functions.https.onCall(async (data, context) => {
  const opponentUid = data?.opponentUid;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!opponentUid) {
    throw new functions.https.HttpsError('invalid-argument', 'opponentUid is required');
  }
  if (opponentUid === uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot create match with self');
  }

  const db = admin.firestore();

  const [block1, block2] = await Promise.all([
    db.collection('blocks').doc(uid).collection('blocked').doc(opponentUid).get(),
    db.collection('blocks').doc(opponentUid).collection('blocked').doc(uid).get(),
  ]);

  if (block1.exists || block2.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Users are blocked');
  }

  const sorted = [uid, opponentUid].sort();
  const matchId = sorted.join('_');
  const matchRef = db.collection('matches').doc(matchId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(matchRef);
    if (!snap.exists) {
      tx.set(matchRef, {
        users: sorted,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  return { matchId };
});

module.exports = { createMatch };
