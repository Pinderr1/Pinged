import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const ROWS = 5;
const COLS = 5;
const MINES = 5;

function createBoard(random) {
  const board = Array(ROWS * COLS).fill(0);
  let mines = 0;
  while (mines < MINES) {
    const idx = random.Shuffle([...Array(board.length).keys()])[0];
    if (board[idx] === -1) continue;
    board[idx] = -1;
    mines++;
  }
  for (let i = 0; i < board.length; i++) {
    if (board[i] === -1) continue;
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (board[nr * COLS + nc] === -1) count++;
        }
      }
    }
    board[i] = count;
  }
  return board;
}

const MinesweeperGame = {
  setup: (ctx) => ({
    board: createBoard(ctx.random),
    revealed: Array(ROWS * COLS).fill(false),
    flagged: Array(ROWS * COLS).fill(false),
  }),
  moves: {
    reveal: ({ G }, idx) => {
      if (G.revealed[idx] || G.flagged[idx]) return INVALID_MOVE;
      const flood = (i) => {
        if (i < 0 || i >= ROWS * COLS) return;
        if (G.revealed[i] || G.flagged[i]) return;
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        G.revealed[i] = true;
        if (G.board[i] === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                flood(nr * COLS + nc);
              }
            }
          }
        }
      };
      flood(idx);
    },
    toggleFlag: ({ G }, idx) => {
      if (G.revealed[idx]) return INVALID_MOVE;
      G.flagged[idx] = !G.flagged[idx];
    },
  },
  endIf: ({ G }) => {
    for (let i = 0; i < G.board.length; i++) {
      if (G.revealed[i] && G.board[i] === -1) return { winner: '1' };
    }
    const cleared = G.board.every((v, i) => v === -1 || G.revealed[i]);
    if (cleared) return { winner: '0' };
  },
};

const Cell = ({ value, revealed, flagged, onReveal, onFlag }) => {
  let display = '';
  if (revealed) {
    display = value === -1 ? '💣' : value > 0 ? String(value) : '';
  } else if (flagged) {
    display = '🚩';
  }
  return (
    <TouchableOpacity
      onPress={onReveal}
      onLongPress={onFlag}
      style={{
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontWeight: 'bold' }}>{display}</Text>
    </TouchableOpacity>
  );
};

const MinesweeperBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const cells = [];
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      cells.push(
        <Cell
          key={idx}
          value={G.board[idx]}
          revealed={G.revealed[idx]}
          flagged={G.flagged[idx]}
          onReveal={() => moves.reveal(idx)}
          onFlag={() => moves.toggleFlag(idx)}
        />
      );
    }
    rows.push(
      <View key={r} style={{ flexDirection: 'row' }}>
        {cells}
      </View>
    );
  }

  let resultText = '';
  if (ctx.gameover) {
    resultText = ctx.gameover.winner === '0' ? 'You win!' : 'You hit a mine!';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {rows}
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>{resultText}</Text>
      )}
    </View>
  );
};

const MinesweeperClient = createGameClient({ game: MinesweeperGame, board: MinesweeperBoard });

export const Game = MinesweeperGame;
export const Board = MinesweeperBoard;
export const meta = { id: 'minesweeper', title: 'Minesweeper' };

export default MinesweeperClient;
