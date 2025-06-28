import { useState, useEffect, useCallback, useMemo } from 'react';
import { INVALID_MOVE } from 'boardgame.io/core';

export default function useBotGame(game, getBotMove, onGameEnd) {
  const [G, setG] = useState(game.setup());
  const [currentPlayer, setCurrentPlayer] = useState('0');
  const [gameover, setGameover] = useState(null);

  const applyMove = useCallback(
    (moveName, ...args) => {
      if (gameover) return;
      const newG = JSON.parse(JSON.stringify(G));
      let nextPlayer = currentPlayer;
      const ctx = {
        currentPlayer,
        random: {
          D6: () => Math.ceil(Math.random() * 6),
        },
        events: {
          endTurn: () => {
            nextPlayer = currentPlayer === '0' ? '1' : '0';
          },
        },
      };
      const move = game.moves[moveName];
      if (!move) return;
      const res = move({ G: newG, ctx }, ...args);
      if (res === INVALID_MOVE) return;
      if (game.turn?.moveLimit === 1 && nextPlayer === currentPlayer) {
        nextPlayer = currentPlayer === '0' ? '1' : '0';
      }
      const over = game.endIf
        ? game.endIf({ G: newG, ctx: { currentPlayer: nextPlayer } })
        : undefined;
      setG(newG);
      setCurrentPlayer(nextPlayer);
      if (over) {
        setGameover(over);
        onGameEnd && onGameEnd(over);
      }
    },
    [G, currentPlayer, gameover, onGameEnd, game]
  );

  const moves = useMemo(() => {
    const m = {};
    for (const name of Object.keys(game.moves || {})) {
      m[name] = (...args) => applyMove(name, ...args);
    }
    return m;
  }, [applyMove, game]);

  useEffect(() => {
    if (currentPlayer === '1' && !gameover) {
      const action = getBotMove(G, currentPlayer, game);
      if (action && moves[action.move]) {
        const t = setTimeout(() => moves[action.move](...(action.args || [])), 600);
        return () => clearTimeout(t);
      }
    }
  }, [currentPlayer, G, gameover, moves, getBotMove]);

  const reset = () => {
    setG(game.setup());
    setCurrentPlayer('0');
    setGameover(null);
  };

  return { G, ctx: { currentPlayer, gameover }, moves, reset };
}
