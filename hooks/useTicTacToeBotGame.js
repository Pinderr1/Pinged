import { useState, useEffect, useCallback } from 'react';
import { INVALID_MOVE } from 'boardgame.io/core';
import { Game as TicTacToeGame } from '../games/tic-tac-toe';
import { getBotMove } from '../ai/ticTacToeBot';

export default function useTicTacToeBotGame(onGameEnd) {
  const [G, setG] = useState(TicTacToeGame.setup());
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
      const move = TicTacToeGame.moves[moveName];
      if (!move) return;
      const res = move({ G: newG, ctx }, ...args);
      if (res === INVALID_MOVE) return;
      if (TicTacToeGame.turn?.moveLimit === 1 && nextPlayer === currentPlayer) {
        nextPlayer = currentPlayer === '0' ? '1' : '0';
      }
      const over = TicTacToeGame.endIf
        ? TicTacToeGame.endIf({ G: newG, ctx: { currentPlayer: nextPlayer } })
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

  const moves = { clickCell: (idx) => applyMove('clickCell', idx) };

  useEffect(() => {
    if (currentPlayer === '1' && !gameover) {
      const idx = getBotMove(G.cells);
      if (idx !== null && idx !== undefined) {
        const t = setTimeout(() => moves.clickCell(idx), 600);
        return () => clearTimeout(t);
      }
    }
  }, [currentPlayer, G, gameover]);

  const reset = () => {
    setG(TicTacToeGame.setup());
    setCurrentPlayer('0');
    setGameover(null);
  };

  return { G, ctx: { currentPlayer, gameover }, moves, reset };
}
