const functions = require('firebase-functions');
const admin = require('firebase-admin');

const RATE_LIMIT_MS = 1000; // 1 second

const sendChatMessage = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  const matchId = data?.matchId;
  const message = data?.message || {};
  const system = !!data?.system;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!matchId) {
    throw new functions.https.HttpsError('invalid-argument', 'matchId is required');
  }

  const db = admin.firestore();
  const matchRef = db.collection('matches').doc(matchId);
  const matchSnap = await matchRef.get();
  if (!matchSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Match not found');
  }
  const users = matchSnap.get('users') || [];
  if (!users.includes(uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Not a participant');
  }
  const otherId = users.find((u) => u !== uid);
  if (otherId) {
    const [block1, block2] = await Promise.all([
      db.doc(`blocks/${uid}/blocked/${otherId}`).get(),
      db.doc(`blocks/${otherId}/blocked/${uid}`).get(),
    ]);
    if (block1.exists || block2.exists) {
      await matchRef.update({
        status: 'blocked',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      throw new functions.https.HttpsError('failed-precondition', 'Users are blocked');
    }
  }

  const limiterRef = db
    .collection('messageLimits')
    .doc(uid)
    .collection('matches')
    .doc(matchId);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(limiterRef);
    const last = snap.get('ts') || 0;
    if (now - last < RATE_LIMIT_MS) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many messages');
    }
    tx.set(limiterRef, {
      ts: now,
      // Use Firestore TTL on `expiresAt` to clean up old limiter docs.
      expiresAt: admin.firestore.Timestamp.fromMillis(
        now + 60 * 60 * 1000,
      ),
    });
  });

  const payload = {
    senderId: system ? 'system' : uid,
    reactions: {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ...message,
  };

  await db.collection('matches').doc(matchId).collection('messages').add(payload);

  return { success: true };
});

module.exports = { sendChatMessage };
