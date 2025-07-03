import { useEffect, useState, useCallback } from 'react';
import { INVALID_MOVE } from 'boardgame.io/core';
import firebase from '../firebase';
import { games } from '../games';
import { useUser } from '../contexts/UserContext';
import { useSound } from '../contexts/SoundContext';
import { snapshotExists } from '../utils/firestore';

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

    try {
      await firebase
        .firestore()
        .collection('gameSessions')
        .doc(sessionId)
        .update({
          state: G,
          currentPlayer: nextPlayer,
          gameover: gameover || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          moves: firebase.firestore.FieldValue.arrayUnion({ action: moveName, player: String(idx), at: firebase.firestore.FieldValue.serverTimestamp() }),
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

  return {
    G: session?.state,
    ctx: { currentPlayer: session?.currentPlayer, gameover: session?.gameover },
    moves,
    moveHistory: session?.moves || [],
    loading: !session,
  };
}
