const functions = require('firebase-functions');
const admin = require('firebase-admin');

const onLikeCreate = functions.firestore
  .document('likes/{uid}/liked/{targetUid}')
  .onCreate(async (snap, ctx) => {
    const { uid, targetUid } = ctx.params;
    const db = admin.firestore();
    await db
      .doc(`likes/${targetUid}/likedBy/${uid}`)
      .set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
  });

module.exports = { onLikeCreate };
