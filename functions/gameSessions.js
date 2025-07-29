const functions = require('firebase-functions');
const admin = require('firebase-admin');

const joinGameSession = functions.https.onCall(async (data, context) => {
  const gameId = data?.gameId;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!gameId) {
    throw new functions.https.HttpsError('invalid-argument', 'gameId is required');
  }

  const db = admin.firestore();
  const sessions = db.collection('gameSessions');

  try {
    return await db.runTransaction(async (tx) => {
      const waiting = await tx.get(
        sessions
          .where('gameId', '==', gameId)
          .where('players.1', '==', null)
          .where('status', '==', 'waiting')
          .limit(1)
      );

      if (!waiting.empty) {
        const doc = waiting.docs[0];
        const data = doc.data() || {};
        const firstPlayer = Array.isArray(data.players) ? data.players[0] : null;
        tx.update(doc.ref, {
          players: [firstPlayer, uid],
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { sessionId: doc.id, opponentId: firstPlayer };
      }

      const newRef = sessions.doc();
      tx.set(newRef, {
        gameId,
        players: [uid, null],
        status: 'waiting',
        moves: [],
        currentPlayer: '0',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { sessionId: newRef.id, opponentId: null };
    });
  } catch (e) {
    console.error('Failed to join game session', e);
    throw new functions.https.HttpsError('internal', 'Failed to join game session');
  }
});

module.exports = { joinGameSession };

