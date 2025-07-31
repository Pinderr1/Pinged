const functions = require('firebase-functions');
const admin = require('firebase-admin');

const DAILY_LIMIT = 100;

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
      .collection('likes')
      .doc(uid)
      .collection('liked')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .get();
    if (sent.size >= DAILY_LIMIT) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily like limit reached');
    }
  }

  const likeRef = db.collection('likes').doc(uid).collection('liked').doc(targetUid);
  const existing = await likeRef.get();
  if (!existing.exists) {
    await likeRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }

  return { success: true };
});

module.exports = { onLikeCreate, onLikeDelete, sendLike };
