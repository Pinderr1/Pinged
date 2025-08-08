const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { INVALID_MOVE } = require('boardgame.io/core');
const games = require('./games');

// Maximum number of recent moves to retain for each game session.
// Older moves beyond this count will be squashed into the session state.
const MAX_MOVE_HISTORY = 50;

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

async function compressSession(doc) {
  const data = doc.data() || {};
  const moves = Array.isArray(data.moves) ? data.moves : [];
  if (moves.length <= MAX_MOVE_HISTORY) return;

  const Game = games[data.gameId];
  if (!Game) return;

  const trimCount = moves.length - MAX_MOVE_HISTORY;
  const olderMoves = moves.slice(0, trimCount);
  const recentMoves = moves.slice(trimCount);
  const state = replayGame(Game, data.state, olderMoves);
  if (state.invalid) return;

  await doc.ref.update({
    state: state.G,
    currentPlayer: state.currentPlayer,
    gameover: state.gameover || null,
    moves: recentMoves,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Scheduled job to periodically compress game session histories.
const compressGameSessions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const db = admin.firestore();
    const snap = await db.collection('gameSessions').get();
    await Promise.all(snap.docs.map((doc) => compressSession(doc)));
    return null;
  });

module.exports = { compressGameSessions };
