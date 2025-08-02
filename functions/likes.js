const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { createMatchIfMutualLikeInternal } = require('./src/match.js');

const DEFAULT_LIMIT = 100;

async function getDailyLimit() {
  try {
    const snap = await admin.firestore().collection('config').doc('app').get();
    const val = snap.get('maxDailyLikes');
    return Number.isFinite(val) ? val : DEFAULT_LIMIT;
  } catch (e) {
    console.warn('Failed to load maxDailyLikes', e);
    return DEFAULT_LIMIT;
  }
}

const onLikeCreate = functions.firestore
  .document('likes/{uid}/liked/{targetUid}')
  .onCreate(async (snap, ctx) => {
    const { uid, targetUid } = ctx.params;
    const db = admin.firestore();
    const ref = db.doc(`likes/${targetUid}/likedBy/${uid}`);
    const existing = await ref.get();
    if (existing.exists) return null;
    await ref.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return null;
  });

const onLikeDelete = functions.firestore
  .document('likes/{uid}/liked/{targetUid}')
  .onDelete(async (_, context) => {
    const { uid, targetUid } = context.params;
    await admin.firestore().doc(`likes/${targetUid}/likedBy/${uid}`).delete();
  });

const sendLike = functions.https.onCall(async (data, context) => {
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
  const DAILY_LIMIT = await getDailyLimit();

  const [block1, block2, userSnap] = await Promise.all([
    db.doc(`blocks/${uid}/blocked/${targetUid}`).get(),
    db.doc(`blocks/${targetUid}/blocked/${uid}`).get(),
    db.collection('users').doc(uid).get(),
  ]);

  if (block1.exists || block2.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Users are blocked');
  }

  const isPremium = !!userSnap.get('isPremium');
  const likeRef = db.collection('likes').doc(uid).collection('liked').doc(targetUid);
  const limitRef = db.collection('limits').doc(uid);

  await db.runTransaction(async (tx) => {
    const [likeSnap, limitSnap] = await Promise.all([
      tx.get(likeRef),
      tx.get(limitRef),
    ]);

    let count = 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (limitSnap.exists) {
      const updated = limitSnap.get('dailyLikesUpdatedAt');
      if (updated?.toDate?.() >= start) {
        count = limitSnap.get('dailyLikes') || 0;
      }
    }

    if (!isPremium && count >= DAILY_LIMIT) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily like limit reached');
    }

    if (!likeSnap.exists) {
      tx.set(likeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
      tx.set(
        limitRef,
        {
          dailyLikes: count + 1,
          dailyLikesUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  });

  return { success: true };
});

const likeAndMaybeMatch = functions.https.onCall(async (data, context) => {
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
  const DAILY_LIMIT = await getDailyLimit();

  const [block1, block2, userSnap] = await Promise.all([
    db.doc(`blocks/${uid}/blocked/${targetUid}`).get(),
    db.doc(`blocks/${targetUid}/blocked/${uid}`).get(),
    db.collection('users').doc(uid).get(),
  ]);

  if (block1.exists || block2.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Users are blocked');
  }

  const isPremium = !!userSnap.get('isPremium');
  const sorted = [uid, targetUid].sort();
  const matchId = sorted.join('_');

  const res = await db.runTransaction(async (tx) => {
    const likeRef = db.collection('likes').doc(uid).collection('liked').doc(targetUid);
    const otherLikeRef = db.collection('likes').doc(targetUid).collection('liked').doc(uid);
    const matchRef = db.collection('matches').doc(matchId);
    const limitRef = db.collection('limits').doc(uid);
    const [
      likeSnap,
      otherLikeSnap,
      matchSnap,
      blockSnap1,
      blockSnap2,
      limitSnap,
    ] = await Promise.all([
      tx.get(likeRef),
      tx.get(otherLikeRef),
      tx.get(matchRef),
      tx.get(db.collection('blocks').doc(uid).collection('blocked').doc(targetUid)),
      tx.get(db.collection('blocks').doc(targetUid).collection('blocked').doc(uid)),
      tx.get(limitRef),
    ]);

    if (matchSnap.exists) {
      return { matchId };
    }

    if (blockSnap1.exists || blockSnap2.exists) {
      return { matchId: null };
    }

    let count = 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (limitSnap.exists) {
      const updated = limitSnap.get('dailyLikesUpdatedAt');
      if (updated?.toDate?.() >= start) {
        count = limitSnap.get('dailyLikes') || 0;
      }
    }

    if (!isPremium && !likeSnap.exists && count >= DAILY_LIMIT) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily like limit reached');
    }

    if (!likeSnap.exists) {
      tx.set(likeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
      tx.set(
        limitRef,
        {
          dailyLikes: count + 1,
          dailyLikesUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (otherLikeSnap.exists) {
      tx.set(matchRef, {
        users: sorted,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { matchId };
    }

    return { matchId: null };
  });

  return { matchId: res.matchId };
});

module.exports = { onLikeCreate, onLikeDelete, sendLike, likeAndMaybeMatch };
