const functions = require('firebase-functions');
const admin = require('firebase-admin');

const incrementXp = functions.https.onCall(async (data, context) => {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  let amount = Number(data && data.amount);
  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'amount must be positive');
  }
  if (amount > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'amount too large');
  }

  const db = admin.firestore();
  try {
    return await db.runTransaction(async (tx) => {
      const ref = db.collection('users').doc(uid);
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const now = admin.firestore.Timestamp.now();
      const lastGame = data.lastGame;
      let streak = data.streak || 0;

      if (lastGame && lastGame.toMillis) {
        if (now.toMillis() - lastGame.toMillis() < 24 * 60 * 60 * 1000) {
          streak += 1;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }

      tx.update(ref, {
        xp: admin.firestore.FieldValue.increment(amount),
        streak,
        lastGame: now,
      });
      return { xp: (data.xp || 0) + amount, streak };
    });
  } catch (e) {
    console.error('Failed to increment xp', e);
    throw new functions.https.HttpsError('internal', 'Failed to increment xp');
  }
});

module.exports = {
  incrementXp,
};
