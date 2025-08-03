const functions = require('firebase-functions');
const admin = require('firebase-admin');

const DEFAULT_LIMIT = 1;

async function getGameLimit() {
  try {
    const snap = await admin.firestore().collection('config').doc('app').get();
    const val = snap.get('maxFreeGames');
    return Number.isFinite(val) ? val : DEFAULT_LIMIT;
  } catch (e) {
    console.warn('Failed to load maxFreeGames', e);
    return DEFAULT_LIMIT;
  }
}

const recordGamePlay = functions.https.onCall(async (_, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const db = admin.firestore();
  const limit = await getGameLimit();
  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data() || {};
    if (data.isPremium) return;
    const last = data.lastGamePlayedAt?.toDate?.() || (data.lastGamePlayedAt ? new Date(data.lastGamePlayedAt) : null);
    const now = new Date();
    let count = 0;
    if (last && last.toDateString() === now.toDateString()) {
      count = data.dailyPlayCount || 0;
    }
    if (count >= limit) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily game limit reached');
    }
    tx.update(userRef, {
      dailyPlayCount: count + 1,
      lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});

module.exports = { recordGamePlay };
