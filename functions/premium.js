const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { createMatchIfMutualLikeInternal } = require('./src/match.js');

const DEFAULT_LIKE_LIMIT = 100;
const DEFAULT_INVITE_LIMIT = 20;
const DEFAULT_SUPERLIKE_LIMIT = 1;

async function getConfigValue(key, fallback) {
  try {
    const snap = await admin.firestore().collection('config').doc('app').get();
    const val = snap.get(key);
    return Number.isFinite(val) ? val : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return fallback;
  }
}

async function getDailyLikeLimit() {
  return getConfigValue('maxDailyLikes', DEFAULT_LIKE_LIMIT);
}

async function getDailyInviteLimit() {
  return getConfigValue('maxDailyInvites', DEFAULT_INVITE_LIMIT);
}

async function getDailySuperLikeLimit() {
  return getConfigValue('maxDailySuperLikes', DEFAULT_SUPERLIKE_LIMIT);
}

const activateBoost = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const boostUntil = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 60 * 1000);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const user = snap.data() || {};
    const isPremium = !!user.isPremium;
    if (!isPremium && user.boostTrialUsed) {
      throw new functions.https.HttpsError('resource-exhausted', 'No boosts remaining');
    }
    const updates = { boostUntil };
    if (!isPremium) updates.boostTrialUsed = true;
    tx.set(userRef, updates, { merge: true });
  });
  return { boostUntil: boostUntil.toDate() };
});

const sendSuperLike = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  const targetUid = data?.targetUid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required');
  }
  if (uid === targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot like yourself');
  }
  const db = admin.firestore();
  const MAX_DAILY = await getDailySuperLikeLimit();
  const [block1, block2, userSnap] = await Promise.all([
    db.doc(`blocks/${uid}/blocked/${targetUid}`).get(),
    db.doc(`blocks/${targetUid}/blocked/${uid}`).get(),
    db.collection('users').doc(uid).get(),
  ]);
  if (block1.exists || block2.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Users are blocked');
  }
  const isPremium = !!userSnap.get('isPremium');
  if (!isPremium) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sent = await db
      .collection('superLikes')
      .doc(uid)
      .collection('sent')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .get();
    if (sent.size >= MAX_DAILY) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily superlike limit reached');
    }
  }
  const likeRef = db.collection('likes').doc(uid).collection('liked').doc(targetUid);
  const superRef = db.collection('superLikes').doc(uid).collection('sent').doc(targetUid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(likeRef);
    if (!snap.exists) {
      tx.set(likeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp(), super: true });
    } else {
      tx.set(likeRef, { super: true }, { merge: true });
    }
    tx.set(superRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  const { matchId } = await createMatchIfMutualLikeInternal({ uid, targetUid }, context);
  return { matchId };
});

const getPremiumFlags = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const db = admin.firestore();
  const userSnap = await db.collection('users').doc(uid).get();
  const user = userSnap.data() || {};
  const isPremium = !!user.isPremium;
  let canSwipe = true;
  let canInvite = true;
  let canBoost = true;
  let canSuperlike = true;
  if (!isPremium) {
    const likeLimit = await getDailyLikeLimit();
    const inviteLimit = await getDailyInviteLimit();
    const superLimit = await getDailySuperLikeLimit();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const since = admin.firestore.Timestamp.fromDate(start);
    const [likesSnap, invitesSnap, superSnap] = await Promise.all([
      db
        .collection('likes')
        .doc(uid)
        .collection('liked')
        .where('createdAt', '>=', since)
        .get(),
      db
        .collection('gameInvites')
        .where('from', '==', uid)
        .where('createdAt', '>=', since)
        .get(),
      db
        .collection('superLikes')
        .doc(uid)
        .collection('sent')
        .where('createdAt', '>=', since)
        .get(),
    ]);
    canSwipe = likesSnap.size < likeLimit;
    canInvite = invitesSnap.size < inviteLimit;
    canSuperlike = superSnap.size < superLimit;
    canBoost = !user.boostTrialUsed;
  }
  return { canSwipe, canInvite, canBoost, canSuperlike };
});

module.exports = { activateBoost, sendSuperLike, getPremiumFlags };
