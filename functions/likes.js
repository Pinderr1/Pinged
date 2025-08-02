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
  const sorted = [uid, targetUid].sort();
  const matchId = sorted.join('_');

  try {
    const res = await db.runTransaction(async (tx) => {
      const likeRef = db.collection('likes').doc(uid).collection('liked').doc(targetUid);
      const otherLikeRef = db.collection('likes').doc(targetUid).collection('liked').doc(uid);
      const matchRef = db.collection('matches').doc(matchId);
      const blockRef1 = db.collection('blocks').doc(uid).collection('blocked').doc(targetUid);
      const blockRef2 = db
        .collection('blocks')
        .doc(targetUid)
        .collection('blocked')
        .doc(uid);
      const userRef = db.collection('users').doc(uid);

      const [
        likeSnap,
        otherLikeSnap,
        matchSnap,
        blockSnap1,
        blockSnap2,
        userSnap,
      ] = await Promise.all([
        tx.get(likeRef),
        tx.get(otherLikeRef),
        tx.get(matchRef),
        tx.get(blockRef1),
        tx.get(blockRef2),
        tx.get(userRef),
      ]);

      if (blockSnap1.exists || blockSnap2.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Users are blocked');
      }

      const userData = userSnap.data() || {};
      const isPremium = !!userData.isPremium;
      if (!isPremium && !likeSnap.exists) {
        const now = admin.firestore.Timestamp.now();
        const last = userData.lastLikeSentAt;
        let dailyCount = 0;
        if (last && now.toDate().toDateString() === last.toDate().toDateString()) {
          dailyCount = userData.dailyLikeCount || 0;
        }
        if (dailyCount >= DAILY_LIMIT) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Daily like limit reached',
          );
        }
        dailyCount += 1;
        tx.set(
          userRef,
          {
            dailyLikeCount: dailyCount,
            lastLikeSentAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (matchSnap.exists) {
        return { matchId };
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
  } catch (e) {
    if (e instanceof functions.https.HttpsError) {
      throw e;
    }
    console.error('Failed to process like', e);
    throw new functions.https.HttpsError('internal', 'Failed to process like');
  }
});

module.exports = { onLikeCreate, onLikeDelete, likeAndMaybeMatch };
