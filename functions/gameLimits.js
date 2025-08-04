const functions = require('firebase-functions');
const admin = require('firebase-admin');

const DEFAULT_LIMIT = 1;

async function getDailyLimit() {
  try {
    const snap = await admin.firestore().collection('config').doc('app').get();
    const val = snap.get('maxFreeGames');
    return Number.isFinite(val) ? val : DEFAULT_LIMIT;
  } catch (e) {
    console.warn('Failed to load maxFreeGames', e);
    return DEFAULT_LIMIT;
  }
}

const recordGamePlay = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const limit = await getDailyLimit();
  const res = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const isPremium = !!snap.get('isPremium');
    if (isPremium) {
      return { gamesLeft: Infinity };
    }
    const last = snap.get('lastGamePlayedAt');
    const count = snap.get('dailyPlayCount') || 0;
    const lastDate = last?.toDate ? last.toDate() : last ? new Date(last) : null;
    const today = new Date();
    let newCount = count;
    if (!lastDate || lastDate.toDateString() !== today.toDateString()) {
      newCount = 0;
    }
    if (newCount >= limit) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily game limit reached');
    }
    newCount += 1;
    tx.update(userRef, {
      dailyPlayCount: newCount,
      lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { gamesLeft: limit - newCount };
  });
  return res;
});

module.exports = { recordGamePlay };
