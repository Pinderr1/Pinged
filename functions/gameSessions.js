const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { INVALID_MOVE } = require('boardgame.io/core');
const games = require('./games');

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

  for (const m of moves) {
    const move = Game.moves[m.action];
    if (!move) continue;
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
    if (res === INVALID_MOVE) continue;
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

  return { G, currentPlayer, gameover };
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
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'Session not found');
      }

      const sess = snap.data() || {};
      const Game = games[sess.gameId];
      if (!Game) {
        throw new functions.https.HttpsError('failed-precondition', 'Unsupported game');
      }

      const players = sess.players || [];
      const idx = players.indexOf(uid);
      if (idx === -1) {
        throw new functions.https.HttpsError('permission-denied', 'Not a participant');
      }

      const { G, currentPlayer, gameover } = replayGame(Game, sess.state, sess.moves);

      if (String(idx) !== currentPlayer) {
        throw new functions.https.HttpsError('failed-precondition', 'Not your turn');
      }
      if (gameover) {
        throw new functions.https.HttpsError('failed-precondition', 'Game already finished');
      }

      const nextState = JSON.parse(JSON.stringify(G));
      let nextPlayer = currentPlayer;
      const ctx = {
        currentPlayer,
        events: {
          endTurn: () => {
            nextPlayer = currentPlayer === '0' ? '1' : '0';
          },
        },
      };

      const move = Game.moves[moveName];
      if (!move) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid move');
      }
      const res = move({ G: nextState, ctx }, ...args);
      if (res === INVALID_MOVE) {
        throw new functions.https.HttpsError('failed-precondition', 'Invalid move');
      }

      if (Game.turn?.moveLimit === 1 && nextPlayer === currentPlayer) {
        nextPlayer = currentPlayer === '0' ? '1' : '0';
      }

      const over = Game.endIf ? Game.endIf({ G: nextState, ctx: { currentPlayer: nextPlayer } }) : undefined;

      tx.update(ref, {
        currentPlayer: nextPlayer,
        gameover: over || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        moves: admin.firestore.FieldValue.arrayUnion({
          action: moveName,
          player: String(idx),
          args,
          at: admin.firestore.FieldValue.serverTimestamp(),
        }),
      });
    });

    return { success: true };
  } catch (e) {
    if (e instanceof functions.https.HttpsError) {
      throw e;
    }
    console.error('Failed to make move', e);
    throw new functions.https.HttpsError('internal', 'Failed to make move');
  }
});

const recordGamePlayed = functions.https.onCall(async (_, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const db = admin.firestore();
  const limit = await getDailyLimit();

  return await db.runTransaction(async (tx) => {
    const ref = db.collection('users').doc(uid);
    const snap = await tx.get(ref);
    const isPremium = !!snap.get('isPremium');
    if (isPremium) {
      tx.update(ref, {
        lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { remaining: Infinity };
    }
    const last = snap.get('lastGamePlayedAt')?.toDate?.() ||
      (snap.get('lastGamePlayedAt') ? new Date(snap.get('lastGamePlayedAt')) : null);
    let count = snap.get('dailyPlayCount') || 0;
    const today = new Date();
    if (!last || last.toDateString() !== today.toDateString()) {
      count = 0;
    }
    if (count >= limit) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Daily game limit reached'
      );
    }
    count += 1;
    tx.update(ref, {
      dailyPlayCount: count,
      lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { remaining: Math.max(limit - count, 0) };
  });
});

module.exports = { joinGameSession, makeMove, recordGamePlayed };

