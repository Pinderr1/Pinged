const { firestore } = require('firebase-functions');
const admin = require('firebase-admin');

const onLikeCreate = firestore
  .document('likes/{uid}/liked/{targetUid}')
  .onCreate(async (snap, ctx) => {
    const { uid, targetUid } = ctx.params;
    const db = admin.firestore();
    const ref = db.doc(`likes/${targetUid}/likedBy/${uid}`);
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) {
        tx.set(ref, {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
  });

module.exports = { onLikeCreate };
