import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const ROWS = 6;
const COLS = 7;

const ConnectFourGame = {
  setup: () => ({ cells: Array(ROWS * COLS).fill(null) }),
  turn: { moveLimit: 1 },
  moves: {
    drop: ({ G, ctx }, col) => {
      for (let row = ROWS - 1; row >= 0; row--) {
        const idx = row * COLS + col;
        if (G.cells[idx] === null) {
          G.cells[idx] = ctx.currentPlayer;
          return;
        }
      }
      return INVALID_MOVE;
    },
  },
  endIf: ({ G }) => {
    const cells = G.cells;
    const win = (a, b, c, d) =>
      cells[a] !== null &&
      cells[a] === cells[b] &&
      cells[a] === cells[c] &&
      cells[a] === cells[d];
    // horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col <= COLS - 4; col++) {
        const i = r * COLS + col;
        if (win(i, i + 1, i + 2, i + 3)) return { winner: cells[i] };
      }
    }
    // vertical
    for (let col = 0; col < COLS; col++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const i = r * COLS + col;
        if (win(i, i + COLS, i + 2 * COLS, i + 3 * COLS)) return { winner: cells[i] };
      }
    }
    // diag down-right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let col = 0; col <= COLS - 4; col++) {
        const i = r * COLS + col;
        if (win(i, i + COLS + 1, i + 2 * (COLS + 1), i + 3 * (COLS + 1))) return { winner: cells[i] };
      }
    }
    // diag down-left
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let col = 3; col < COLS; col++) {
        const i = r * COLS + col;
        if (win(i, i + COLS - 1, i + 2 * (COLS - 1), i + 3 * (COLS - 1))) return { winner: cells[i] };
      }
    }
    if (cells.every(cell => cell !== null)) return { draw: true };
  },
};

const Cell = ({ value }) => {
  const bg = value === '0' ? 'red' : value === '1' ? 'yellow' : 'transparent';
  const borderStyle = value ? {} : { borderWidth: 1, borderColor: '#333' };
  return (
    <View
      style={{ width: 40, height: 40, margin: 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: bg, ...borderStyle }}
      />
    </View>
  );
};

const ConnectFourBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const disabled = !!ctx.gameover;

  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const cells = [];
    for (let cIdx = 0; cIdx < COLS; cIdx++) {
      const idx = r * COLS + cIdx;
      cells.push(
        <TouchableOpacity key={cIdx} onPress={() => moves.drop(cIdx)} disabled={disabled}>
          <Cell value={G.cells[idx]} />
        </TouchableOpacity>
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
    if (ctx.gameover.draw) {
      resultText = 'Draw';
    } else if (ctx.gameover.winner === '0') {
      resultText = 'You win!';
    } else {
      resultText = 'You lose!';
    }
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      {rows}
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>{resultText}</Text>
      )}
    </View>
  );
};

const ConnectFourClient = createGameClient({ game: ConnectFourGame, board: ConnectFourBoard });

export const Game = ConnectFourGame;
export const Board = ConnectFourBoard;
export const meta = { id: 'connectFour', title: 'Connect Four' };

export default ConnectFourClient;
