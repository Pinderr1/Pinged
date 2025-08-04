const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { INVALID_MOVE } = require('boardgame.io/core');
const games = require('./games');

// Duration allowed for each move in milliseconds (24h)
const TURN_DURATION_MS = 24 * 60 * 60 * 1000;

const DEFAULT_LIMIT = 1;

async function getDailyLimit() {
  try {
    const snap = await admin.firestore().collection('config').doc('app').get();
    const val = snap.get('maxFreeGames');
    return Number.isFinite(val) ? val : DEFAULT_LIMIT;
  } catch (e) {
    console.warn('Failed to load maxFreeGames', e);
    return DEFAULT_LIMIT;
  }
}

function replayGame(Game, initial, moves = []) {
  let G = JSON.parse(JSON.stringify(initial || Game.setup()));
  let currentPlayer = '0';
  let gameover = null;
  let invalid = false;

  for (const m of moves) {
    const move = Game.moves[m.action];
    if (!move) {
      invalid = true;
      break;
    }
    let nextPlayer = currentPlayer;
    const ctx = {
      currentPlayer,
      events: {
        endTurn: () => {
          nextPlayer = currentPlayer === '0' ? '1' : '0';
        },
      },
    };
    const args = Array.isArray(m.args) ? m.args : [];
    const res = move({ G, ctx }, ...args);
    if (res === INVALID_MOVE) {
      invalid = true;
      break;
    }
    if (Game.turn?.moveLimit === 1 && nextPlayer === currentPlayer) {
      nextPlayer = currentPlayer === '0' ? '1' : '0';
    }
    currentPlayer = nextPlayer;
    if (Game.endIf) {
      const over = Game.endIf({ G, ctx: { currentPlayer } });
      if (over) {
        gameover = over;
        break;
      }
    }
  }

  return { G, currentPlayer, gameover, invalid };
}

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
  const dailyLimit = await getDailyLimit();

  try {
    return await db.runTransaction(async (tx) => {
      const userRef = db.collection('users').doc(uid);
      const userSnap = await tx.get(userRef);
      const isPremium = !!userSnap.get('isPremium');
      if (!isPremium) {
        const last = userSnap.get('lastGamePlayedAt');
        const count = userSnap.get('dailyPlayCount') || 0;
        const lastDate = last?.toDate ? last.toDate() : last ? new Date(last) : null;
        const today = new Date();
        let newCount = count;
        if (!lastDate || lastDate.toDateString() !== today.toDateString()) {
          newCount = 0;
        }
        if (newCount >= dailyLimit) {
          throw new functions.https.HttpsError('resource-exhausted', 'Daily game limit reached');
        }
        newCount += 1;
        tx.update(userRef, {
          dailyPlayCount: newCount,
          lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

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
        const expireAt = admin.firestore.Timestamp.fromMillis(Date.now() + TURN_DURATION_MS);
        tx.update(doc.ref, {
          players: [firstPlayer, uid],
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          turnExpiresAt: expireAt,
        });
        return { sessionId: doc.id, opponentId: firstPlayer };
      }

      const newRef = sessions.doc();
      const expireAt = admin.firestore.Timestamp.fromMillis(Date.now() + TURN_DURATION_MS);
      tx.set(newRef, {
        gameId,
        players: [uid, null],
        status: 'waiting',
        moves: [],
        currentPlayer: '0',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        turnExpiresAt: expireAt,
      });
      return { sessionId: newRef.id, opponentId: null };
    });
  } catch (e) {
    console.error('Failed to join game session', e);
    throw new functions.https.HttpsError('internal', 'Failed to join game session');
  }
});

const makeMove = functions.https.onCall(async (data, context) => {
  const sessionId = data?.sessionId;
  const moveName = data?.move;
  const args = Array.isArray(data?.args) ? data.args : [];
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!sessionId || !moveName) {
    throw new functions.https.HttpsError('invalid-argument', 'sessionId and move are required');
  }

  const db = admin.firestore();
  const ref = db.collection('gameSessions').doc(sessionId);

  try {
    let error = null;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        error = { code: 'not-found', message: 'Session not found' };
        return;
      }

      const sess = snap.data() || {};
      const Game = games[sess.gameId];
      if (!Game) {
        error = { code: 'failed-precondition', message: 'Unsupported game' };
        return;
      }

      const players = sess.players || [];
      const idx = players.indexOf(uid);
      const logInfraction = (reason, playerId = uid) => {
        tx.update(ref, {
          infractions: admin.firestore.FieldValue.arrayUnion({
            player: playerId,
            reason,
            move: moveName,
            args,
            at: admin.firestore.FieldValue.serverTimestamp(),
          }),
        });
      };

      if (idx === -1) {
        logInfraction('not-participant');
        error = { code: 'permission-denied', message: 'Not a participant' };
        return;
      }

      const state = replayGame(Game, sess.state, sess.moves);
      if (state.gameover) {
        error = { code: 'failed-precondition', message: 'Game already finished' };
        return;
      }
      if (String(idx) !== state.currentPlayer) {
        logInfraction('not-your-turn');
        error = { code: 'failed-precondition', message: 'Not your turn' };
        return;
      }

      const attempted = replayGame(Game, sess.state, [
        ...sess.moves,
        { action: moveName, args },
      ]);
      if (attempted.invalid) {
        logInfraction('invalid-move');
        error = { code: 'failed-precondition', message: 'Invalid move' };
        return;
      }

      const expireAt = admin.firestore.Timestamp.fromMillis(Date.now() + TURN_DURATION_MS);

      tx.update(ref, {
        currentPlayer: attempted.currentPlayer,
        gameover: attempted.gameover || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        turnExpiresAt: expireAt,
        moves: admin.firestore.FieldValue.arrayUnion({
          action: moveName,
          player: String(idx),
          args,
          at: admin.firestore.FieldValue.serverTimestamp(),
        }),
      });
    });

    if (error) {
      throw new functions.https.HttpsError(error.code, error.message);
    }

    return { success: true };
  } catch (e) {
    if (e instanceof functions.https.HttpsError) {
      throw e;
    }
    console.error('Failed to make move', e);
    throw new functions.https.HttpsError('internal', 'Failed to make move');
  }
});

const checkExpiredSessions = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const snap = await db
    .collection('gameSessions')
    .where('turnExpiresAt', '<', now)
    .limit(100)
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    const data = doc.data() || {};
    if (data.gameover) return;
    const players = data.players || [];
    const current = data.currentPlayer;
    const winnerIdx = current === '0' ? 1 : 0;
    const winner = players[winnerIdx] || null;
    const outcome = winner ? { winner, reason: 'timeout' } : { draw: true, reason: 'timeout' };
    batch.update(doc.ref, {
      gameover: outcome,
      status: winner ? 'forfeit' : 'draw',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  if (!snap.empty) {
    await batch.commit();
  }

  return null;
});

module.exports = { joinGameSession, makeMove, checkExpiredSessions };

