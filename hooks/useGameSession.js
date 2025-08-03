import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { INVALID_MOVE } from 'boardgame.io/core';
import firebase from '../firebase';
import { games } from '../games';
import { useUser } from '../contexts/UserContext';
import { useSound } from '../contexts/SoundContext';
import { snapshotExists } from '../utils/firestore';

// Exported for unit tests
export function replayGame(Game, initial, moves = []) {
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

function applyMove(Game, state, moveData) {
  const move = Game.moves[moveData.action];
  if (!move || state.gameover) return state;
  let nextPlayer = state.currentPlayer;
  const ctx = {
    currentPlayer: state.currentPlayer,
    events: {
      endTurn: () => {
        nextPlayer = state.currentPlayer === '0' ? '1' : '0';
      },
    },
  };
  const args = Array.isArray(moveData.args) ? moveData.args : [];
  const res = move({ G: state.G, ctx }, ...args);
  if (res === INVALID_MOVE) return state;
  if (Game.turn?.moveLimit === 1 && nextPlayer === state.currentPlayer) {
    nextPlayer = state.currentPlayer === '0' ? '1' : '0';
  }
  let gameover = state.gameover;
  if (Game.endIf) {
    const over = Game.endIf({ G: state.G, ctx: { currentPlayer: nextPlayer } });
    if (over) gameover = over;
  }
  return { G: state.G, currentPlayer: nextPlayer, gameover };
}

export default function useGameSession(
  sessionId,
  gameId,
  opponentId,
  allowSpectate = false
) {
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
        if (allowSpectate || data.players?.includes(user.uid)) {
          setSession(data);
        }
      } else if (!initialized && !allowSpectate) {
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
  }, [Game, sessionId, user?.uid, opponentId, gameId, allowSpectate]);

  const sendMove = useCallback(async (moveName, ...args) => {
    if (!session || !Game) return;
    try {
      await firebase.functions().httpsCallable('makeMove')({
        sessionId,
        move: moveName,
        args,
      });
      play('game_move');
    } catch (e) {
      console.warn('Failed to send move', e);
    }
  }, [session, Game, sessionId]);

  const moves = {};
  if (Game) {
    for (const name of Object.keys(Game.moves)) {
      moves[name] = (...args) => sendMove(name, ...args);
    }
  }

  const cacheRef = useRef(null);
  const computed = useMemo(() => {
    if (!Game || !session) return null;
    const moveCount = session.moves?.length || 0;
    const baseState = session.state;
    const prev = cacheRef.current;
    if (!prev || prev.baseState !== baseState || moveCount < prev.moveCount) {
      const fresh = replayGame(Game, baseState, session.moves);
      const res = { ...fresh, moveCount, baseState };
      cacheRef.current = res;
      return res;
    }
    if (moveCount === prev.moveCount) return prev;
    let state = { G: prev.G, currentPlayer: prev.currentPlayer, gameover: prev.gameover };
    for (const m of session.moves.slice(prev.moveCount)) {
      state = applyMove(Game, state, m);
      if (state.gameover) break;
    }
    const res = { ...state, moveCount, baseState };
    cacheRef.current = res;
    return res;
  }, [Game, session?.state, session?.moves?.length]);

  return {
    G: computed?.G,
    ctx: { currentPlayer: computed?.currentPlayer, gameover: computed?.gameover },
    moves,
    moveHistory: session?.moves || [],
    loading: !session,
  };
}
