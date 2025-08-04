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

const getGamesRemaining = functions.https.onCall(async (_, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const db = admin.firestore();
  const DAILY_LIMIT = await getDailyLimit();
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  const isPremium = !!snap.get('isPremium');
  if (isPremium) {
    return { gamesLeft: Infinity };
  }
  const last = snap.get('lastGamePlayedAt');
  const count = snap.get('dailyPlayCount') || 0;
  const today = new Date().toDateString();
  let used = 0;
  if (last && last.toDate && last.toDate().toDateString() === today) {
    used = count;
  }
  return { gamesLeft: Math.max(DAILY_LIMIT - used, 0) };
});

const recordGamePlay = functions.https.onCall(async (_, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const DAILY_LIMIT = await getDailyLimit();

  const res = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const isPremium = !!snap.get('isPremium');
    if (isPremium) {
      tx.update(userRef, {
        lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { gamesLeft: Infinity };
    }
    const last = snap.get('lastGamePlayedAt');
    const count = snap.get('dailyPlayCount') || 0;
    const today = new Date().toDateString();
    let used = 0;
    let newCount = 1;
    if (last && last.toDate && last.toDate().toDateString() === today) {
      used = count;
      if (count >= DAILY_LIMIT) {
        throw new functions.https.HttpsError('resource-exhausted', 'Daily game limit reached');
      }
      newCount = count + 1;
    }
    tx.update(userRef, {
      dailyPlayCount: newCount,
      lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    used = newCount;
    return { gamesLeft: Math.max(DAILY_LIMIT - used, 0) };
  });

  return res;
});

module.exports = { getGamesRemaining, recordGamePlay };
