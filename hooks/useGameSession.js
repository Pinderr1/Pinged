import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { INVALID_MOVE } from 'boardgame.io/core';
import { db } from '../firebase';
import { games } from '../games';
import { useUser } from '../contexts/UserContext';

export default function useGameSession(sessionId, gameId, opponentId) {
  const { user } = useUser();
  const gameEntry = games[gameId];
  const Game = gameEntry?.Game;

  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!Game || !sessionId || !user?.uid) return;
    const ref = doc(db, 'gameSessions', sessionId);
    let initialized = false;
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setSession(snap.data());
      } else if (!initialized) {
        initialized = true;
        await setDoc(ref, {
          gameId,
          players: [user.uid, opponentId],
          state: Game.setup(),
          currentPlayer: '0',
          createdAt: serverTimestamp(),
        });
      }
    });
    return unsub;
  }, [Game, sessionId, user?.uid, opponentId, gameId]);

  const sendMove = useCallback(async (moveName, ...args) => {
    if (!session || !Game) return;
    const idx = session.players.indexOf(user.uid);
    if (String(idx) !== session.currentPlayer) return;
    if (session.gameover) return;

    const G = JSON.parse(JSON.stringify(session.state));
    let nextPlayer = session.currentPlayer;
    const ctx = {
      currentPlayer: session.currentPlayer,
      events: {
        endTurn: () => {
          nextPlayer = session.currentPlayer === '0' ? '1' : '0';
        },
      },
    };

    const move = Game.moves[moveName];
    if (!move) return;
    const res = move({ G, ctx }, ...args);
    if (res === INVALID_MOVE) return;

    if (Game.turn?.moveLimit === 1 && nextPlayer === session.currentPlayer) {
      nextPlayer = session.currentPlayer === '0' ? '1' : '0';
    }

    const gameover = Game.endIf ? Game.endIf({ G, ctx: { currentPlayer: nextPlayer } }) : undefined;

    await updateDoc(doc(db, 'gameSessions', sessionId), {
      state: G,
      currentPlayer: nextPlayer,
      gameover: gameover || null,
      updatedAt: serverTimestamp(),
    });
  }, [session, Game, sessionId, user?.uid]);

  const moves = {};
  if (Game) {
    for (const name of Object.keys(Game.moves)) {
      moves[name] = (...args) => sendMove(name, ...args);
    }
  }

  return {
    G: session?.state,
    ctx: { currentPlayer: session?.currentPlayer, gameover: session?.gameover },
    moves,
    loading: !session,
  };
}
