import { useState, useEffect, useCallback } from 'react';
import { INVALID_MOVE } from 'boardgame.io/core';
import { Game as RPSGame } from '../games/rock-paper-scissors';
import { getBotMove } from '../ai/rockPaperScissorsBot';

export default function useRPSBotGame(onGameEnd) {
  const [G, setG] = useState(RPSGame.setup());
  const [currentPlayer, setCurrentPlayer] = useState('0');
  const [gameover, setGameover] = useState(null);

  const applyMove = useCallback(
    (moveName, ...args) => {
      if (gameover) return;
      const newG = JSON.parse(JSON.stringify(G));
      let nextPlayer = currentPlayer;
      const ctx = {
        currentPlayer,
        events: {
          endTurn: () => {
            nextPlayer = currentPlayer === '0' ? '1' : '0';
          },
        },
      };
      const move = RPSGame.moves[moveName];
      if (!move) return;
      const res = move({ G: newG, ctx }, ...args);
      if (res === INVALID_MOVE) return;
      if (RPSGame.turn?.moveLimit === 1 && nextPlayer === currentPlayer) {
        nextPlayer = currentPlayer === '0' ? '1' : '0';
      }
      const over = RPSGame.endIf
        ? RPSGame.endIf({ G: newG, ctx: { currentPlayer: nextPlayer } })
        : undefined;
      setG(newG);
      setCurrentPlayer(nextPlayer);
      if (over) {
        setGameover(over);
        onGameEnd && onGameEnd(over);
      }
    },
    [G, currentPlayer, gameover, onGameEnd]
  );

  const moves = { choose: (choice) => applyMove('choose', choice) };

  useEffect(() => {
    if (currentPlayer === '1' && !gameover) {
      const choice = getBotMove();
      const t = setTimeout(() => moves.choose(choice), 600);
      return () => clearTimeout(t);
    }
  }, [currentPlayer, gameover]);

  const reset = () => {
    setG(RPSGame.setup());
    setCurrentPlayer('0');
    setGameover(null);
  };

  return { G, ctx: { currentPlayer, gameover }, moves, reset };
}
