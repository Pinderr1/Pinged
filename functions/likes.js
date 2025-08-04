const functions = require('firebase-functions');
const admin = require('firebase-admin');

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

async function updateDailyLikes(uid, delta) {
  const db = admin.firestore();
  const ref = db.collection('limits').doc(uid);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = admin.firestore.Timestamp.fromDate(today);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let count = 0;
    if (snap.exists) {
      const data = snap.data();
      const storedDate = data.dailyLikesDate?.toDate?.();
      if (storedDate && storedDate.getTime() === today.getTime()) {
        count = data.dailyLikes || 0;
      }
    }
    count = Math.max(0, count + delta);
    tx.set(
      ref,
      { dailyLikes: count, dailyLikesDate: todayTs },
      { merge: true }
    );
  });
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
    await updateDailyLikes(uid, 1);
    return null;
  });

const onLikeDelete = functions.firestore
  .document('likes/{uid}/liked/{targetUid}')
  .onDelete(async (_, context) => {
    const { uid, targetUid } = context.params;
    await admin.firestore().doc(`likes/${targetUid}/likedBy/${uid}`).delete();
    await updateDailyLikes(uid, -1);
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
  if (!isPremium) {
    const limitSnap = await db.collection('limits').doc(uid).get();
    let sent = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (limitSnap.exists) {
      const data = limitSnap.data();
      const date = data.dailyLikesDate?.toDate?.();
      if (date && date.getTime() === today.getTime()) {
        sent = data.dailyLikes || 0;
      }
    }
    if (sent >= DAILY_LIMIT) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily like limit reached');
    }
  }

  const sorted = [uid, targetUid].sort();
  const matchId = sorted.join('_');

  const res = await db.runTransaction(async (tx) => {
    const likeRef = db.collection('likes').doc(uid).collection('liked').doc(targetUid);
    const otherLikeRef = db.collection('likes').doc(targetUid).collection('liked').doc(uid);
    const matchRef = db.collection('matches').doc(matchId);
    const [likeSnap, otherLikeSnap, matchSnap, blockSnap1, blockSnap2] = await Promise.all([
      tx.get(likeRef),
      tx.get(otherLikeRef),
      tx.get(matchRef),
      tx.get(db.collection('blocks').doc(uid).collection('blocked').doc(targetUid)),
      tx.get(db.collection('blocks').doc(targetUid).collection('blocked').doc(uid)),
    ]);

    if (matchSnap.exists) {
      return { matchId };
    }

    if (blockSnap1.exists || blockSnap2.exists) {
      return { matchId: null };
    }

    if (!likeSnap.exists) {
      tx.set(likeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
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

module.exports = { onLikeCreate, onLikeDelete, sendLike };
