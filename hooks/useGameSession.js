import { useEffect, useState, useCallback, useMemo } from 'react';
import { INVALID_MOVE } from 'boardgame.io/core';
import firebase from '../firebase';
import { games } from '../games';
import { useUser } from '../contexts/UserContext';
import { useSound } from '../contexts/SoundContext';
import { snapshotExists } from '../utils/firestore';

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

export default function useGameSession(sessionId, gameId, opponentId) {
  const { user } = useUser();
  const { play } = useSound();
  const gameEntry = games[gameId];
  const Game = gameEntry?.Game;

  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!Game || !sessionId || !user?.uid) return;
    const ref = firebase.firestore().collection('gameSessions').doc(sessionId);
    let initialized = false;
    const unsub = ref.onSnapshot(async (snap) => {
      if (snapshotExists(snap)) {
        const data = snap.data();
        if (data.players?.includes(user.uid)) {
          setSession(data);
        }
      } else if (!initialized) {
        initialized = true;
        await ref.set({
          gameId,
          players: [user.uid, opponentId],
          state: Game.setup(),
          currentPlayer: '0',
          moves: [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
    return unsub;
  }, [Game, sessionId, user?.uid, opponentId, gameId]);

  const sendMove = useCallback(async (moveName, ...args) => {
    if (!session || !Game) return;
    const idx = session.players.indexOf(user.uid);
    if (idx === -1) return;

    const { G, currentPlayer, gameover } = replayGame(Game, session.state, session.moves);

    if (String(idx) !== currentPlayer) return;
    if (gameover) return;

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
    if (!move) return;
    const res = move({ G: nextState, ctx }, ...args);
    if (res === INVALID_MOVE) return;

    if (Game.turn?.moveLimit === 1 && nextPlayer === currentPlayer) {
      nextPlayer = currentPlayer === '0' ? '1' : '0';
    }

    const over = Game.endIf ? Game.endIf({ G: nextState, ctx: { currentPlayer: nextPlayer } }) : undefined;

    try {
      await firebase
        .firestore()
        .collection('gameSessions')
        .doc(sessionId)
        .update({
          currentPlayer: nextPlayer,
          gameover: over || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          moves: firebase.firestore.FieldValue.arrayUnion({ action: moveName, player: String(idx), args, at: firebase.firestore.FieldValue.serverTimestamp() }),
        });
      play('game_move');
    } catch (e) {
      console.warn('Failed to update game session', e);
    }
  }, [session, Game, sessionId, user?.uid]);

  const moves = {};
  if (Game) {
    for (const name of Object.keys(Game.moves)) {
      moves[name] = (...args) => sendMove(name, ...args);
    }
  }

  const computed = useMemo(() => {
    if (!Game || !session) return null;
    return replayGame(Game, session.state, session.moves);
  }, [Game, session]);

  return {
    G: computed?.G,
    ctx: { currentPlayer: computed?.currentPlayer, gameover: computed?.gameover },
    moves,
    moveHistory: session?.moves || [],
    loading: !session,
  };
}
