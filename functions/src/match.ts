import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const createMatchIfMutualLike = functions.https.onCall(async (data, context) => {
  const { uid, targetUid } = data || {};

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!uid || !targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and targetUid are required');
  }
  if (context.auth.uid !== uid && !context.auth.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot create match for another user');
  }

  try {
    const [like1, like2] = await Promise.all([
      admin.firestore().collection('likes').doc(uid).collection('liked').doc(targetUid).get(),
      admin.firestore().collection('likes').doc(targetUid).collection('liked').doc(uid).get(),
    ]);

    if (like1.exists && like2.exists) {
      const matchRef = await admin.firestore().collection('matches').add({
        users: [uid, targetUid],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { matchId: matchRef.id };
    }
  } catch (e) {
    console.error('Failed to create match', e);
    throw new functions.https.HttpsError('internal', 'Failed to create match');
  }

  return { match: false };
});
