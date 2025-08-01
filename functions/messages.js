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
  const limiterRef = db.collection('messageLimits').doc(uid);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(limiterRef);
    const last = snap.get('ts') || 0;
    if (now - last < RATE_LIMIT_MS) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many messages');
    }
    tx.set(limiterRef, { ts: now });
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
