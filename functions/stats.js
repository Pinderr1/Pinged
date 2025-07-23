const functions = require('firebase-functions');
const admin = require('firebase-admin');

const incrementXp = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  const amount = Number(data?.amount || 0);
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid XP amount');
  }

  const userRef = admin.firestore().collection('users').doc(uid);
  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data() || {};
    const now = admin.firestore.Timestamp.now();
    const last = data.lastPlayedAt?.toDate?.() || data.lastPlayedAt;
    const lastMs = last?.toMillis ? last.toMillis() : last?.getTime?.();
    const updates = {
      xp: admin.firestore.FieldValue.increment(amount),
      lastPlayedAt: now,
    };
    if (!last) {
      updates.streak = admin.firestore.FieldValue.increment(1);
    } else if (now.toMillis() - lastMs < 86400e3) {
      updates.streak = admin.firestore.FieldValue.increment(1);
    }
    tx.set(userRef, updates, { merge: true });
  });

  return { success: true };
});

module.exports = { incrementXp };
