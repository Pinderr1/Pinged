const functions = require('firebase-functions');
const admin = require('firebase-admin');

const DEFAULT_LIKE_LIMIT = 100;
const INVITE_GAP_MS = 30 * 1000;

async function getDailyLikeLimit() {
  try {
    const snap = await admin.firestore().collection('config').doc('app').get();
    const val = snap.get('maxDailyLikes');
    return Number.isFinite(val) ? val : DEFAULT_LIKE_LIMIT;
  } catch (e) {
    console.warn('Failed to load maxDailyLikes', e);
    return DEFAULT_LIKE_LIMIT;
  }
}

const getPremiumFlags = functions.https.onCall(async (_, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const db = admin.firestore();
  const userSnap = await db.collection('users').doc(uid).get();
  const isPremium = !!userSnap.get('isPremium');
  const flags = { canSwipe: true, canInvite: true };
  if (!isPremium) {
    const DAILY_LIMIT = await getDailyLikeLimit();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const likesSnap = await db
      .collection('likes')
      .doc(uid)
      .collection('liked')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .get();
    if (likesSnap.size >= DAILY_LIMIT) flags.canSwipe = false;
    const inviteMeta = await db.collection('inviteMeta').doc(uid).get();
    const lastInvite = inviteMeta.get('lastInviteAt');
    if (lastInvite && Date.now() - lastInvite.toMillis() < INVITE_GAP_MS) {
      flags.canInvite = false;
    }
  }
  return flags;
});

const activateBoost = functions.https.onCall(async (_, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  const data = snap.data() || {};
  const isPremium = !!data.isPremium;
  if (!isPremium && data.boostTrialUsed) {
    throw new functions.https.HttpsError('resource-exhausted', 'No boosts remaining');
  }
  const boostUntil = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 30 * 60 * 1000)
  );
  const updates = { boostUntil };
  if (!isPremium && !data.boostTrialUsed) updates.boostTrialUsed = true;
  await userRef.update(updates);
  return { boostUntil: boostUntil.toMillis() };
});

const sendSuperlike = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  const targetUid = data?.targetUid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required');
  }
  const db = admin.firestore();
  const userSnap = await db.collection('users').doc(uid).get();
  const isPremium = !!userSnap.get('isPremium');
  if (!isPremium) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sent = await db
      .collection('superlikes')
      .doc(uid)
      .collection('sent')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .get();
    if (sent.size >= 1) {
      throw new functions.https.HttpsError('resource-exhausted', 'No superlikes left');
    }
  }
  await db
    .collection('superlikes')
    .doc(uid)
    .collection('sent')
    .doc(targetUid)
    .set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
  // Also record as like for matching purposes
  await db
    .collection('likes')
    .doc(uid)
    .collection('liked')
    .doc(targetUid)
    .set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      super: true,
    }, { merge: true });
  return { success: true };
});

module.exports = { getPremiumFlags, activateBoost, sendSuperlike };
