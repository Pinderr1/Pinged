import { useMemo, useEffect, useState, useRef } from 'react';
import { Client } from 'boardgame.io/client';
import { useSound } from '../contexts/SoundContext';

export default function useBotGame(game, getBotMove, onGameEnd) {
  const getBotMoveRef = useRef(getBotMove);
  const onGameEndRef = useRef(onGameEnd);
  const { play } = useSound();

  // Keep latest callbacks without re-creating the client
  useEffect(() => {
    getBotMoveRef.current = getBotMove;
  }, [getBotMove]);

  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  const client = useMemo(() => {
    return Client({
      game,
      numPlayers: 2,
      ai: {
        bot: {
          play: ({ state }) =>
            getBotMoveRef.current(state.G, state.ctx.currentPlayer, game),
        },
      },
    });
  }, [game]);

  const [state, setState] = useState(client.getState());

  useEffect(() => {
    client.start();
    const unsub = client.subscribe((s) => {
      setState(s);
      if (s.ctx.gameover && onGameEndRef.current) {
        onGameEndRef.current(s.ctx.gameover);
      }
    });
    return () => unsub();
  }, [client]);

  const moves = useMemo(() => {
    const obj = {};
    for (const name of Object.keys(client.moves)) {
      obj[name] = (...args) => {
        client.moves[name](...args);
        play('game_move');
      };
    }
    return obj;
  }, [client, play]);

  return { G: state.G, ctx: state.ctx, moves, reset: client.reset };
}
