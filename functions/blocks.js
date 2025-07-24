const functions = require('firebase-functions');
const admin = require('firebase-admin');

async function deleteRelatedInvites(uid, targetUid) {
  const db = admin.firestore();
  const inviteRef = db.collection('gameInvites');
  const q1 = inviteRef.where('from', '==', uid).where('to', '==', targetUid).get();
  const q2 = inviteRef.where('from', '==', targetUid).where('to', '==', uid).get();
  const [s1, s2] = await Promise.all([q1, q2]);
  const tasks = [];
  const remove = (snap) => {
    snap.forEach((doc) => {
      tasks.push(doc.ref.delete());
    });
  };
  remove(s1);
  remove(s2);
  await Promise.all(tasks);
}


async function deleteMatches(uid, targetUid) {
  const db = admin.firestore();
  const q = await db.collection('matches').where('users', 'array-contains', uid).get();
  const tasks = [];
  q.forEach((doc) => {
    const users = doc.get('users') || [];
    if (users.includes(targetUid)) tasks.push(doc.ref.delete());
  });
  await Promise.all(tasks);
}

async function deleteLikes(uid, targetUid) {
  const db = admin.firestore();
  const tasks = [
    db.collection('likes').doc(uid).collection('liked').doc(targetUid).delete(),
    db.collection('likes').doc(uid).collection('likedBy').doc(targetUid).delete(),
    db.collection('likes').doc(targetUid).collection('liked').doc(uid).delete(),
    db.collection('likes').doc(targetUid).collection('likedBy').doc(uid).delete(),
  ];
  await Promise.all(tasks);
}

const blockUser = functions.https.onCall(async (data, context) => {
  const targetUid = data?.targetUid;
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required');
  }
  if (uid === targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot block yourself');
  }
  const db = admin.firestore();
  try {
    const blockData = { blockedAt: admin.firestore.FieldValue.serverTimestamp() };
    await Promise.all([
      db.collection('blocks').doc(uid).collection('blocked').doc(targetUid).set(blockData),
      db.collection('blocks').doc(targetUid).collection('blocked').doc(uid).set(blockData),
    ]);
    await Promise.all([
      deleteMatches(uid, targetUid),
      deleteRelatedInvites(uid, targetUid),
      deleteLikes(uid, targetUid),
    ]);
    return { success: true };
  } catch (e) {
    console.error('Block user failed', e);
    throw new functions.https.HttpsError('internal', 'Failed to block user');
  }
});

const unblockUser = functions.https.onCall(async (data, context) => {
  const targetUid = data?.targetUid;
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required');
  }
  const db = admin.firestore();
  try {
    await Promise.all([
      db.collection('blocks').doc(uid).collection('blocked').doc(targetUid).delete(),
      db.collection('blocks').doc(targetUid).collection('blocked').doc(uid).delete(),
    ]);
    return { success: true };
  } catch (e) {
    console.error('Unblock user failed', e);
    throw new functions.https.HttpsError('internal', 'Failed to unblock user');
  }
});

module.exports = { blockUser, unblockUser };
