import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const puzzle = [
  5,3,0,0,7,0,0,0,0,
  6,0,0,1,9,5,0,0,0,
  0,9,8,0,0,0,0,6,0,
  8,0,0,0,6,0,0,0,3,
  4,0,0,8,0,3,0,0,1,
  7,0,0,0,2,0,0,0,6,
  0,6,0,0,0,0,2,8,0,
  0,0,0,4,1,9,0,0,5,
  0,0,0,0,8,0,0,7,9
];

const solution = [
  5,3,4,6,7,8,9,1,2,
  6,7,2,1,9,5,3,4,8,
  1,9,8,3,4,2,5,6,7,
  8,5,9,7,6,1,4,2,3,
  4,2,6,8,5,3,7,9,1,
  7,1,3,9,2,4,8,5,6,
  9,6,1,5,3,7,2,8,4,
  2,8,7,4,1,9,6,3,5,
  3,4,5,2,8,6,1,7,9
];

const SudokuGame = {
  setup: () => ({
    board: puzzle.slice(),
    solution,
    fixed: puzzle.map(v => v !== 0),
  }),
  moves: {
    increment: ({ G }, idx) => {
      if (G.fixed[idx]) return INVALID_MOVE;
      G.board[idx] = (G.board[idx] % 9) + 1;
    },
    clear: ({ G }, idx) => {
      if (G.fixed[idx]) return INVALID_MOVE;
      G.board[idx] = 0;
    }
  },
  endIf: ({ G }) => {
    for (let i = 0; i < 81; i++) {
      if (G.board[i] !== G.solution[i]) return;
    }
    return { winner: '0' };
  },
};

const SudokuBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const rows = [];
  for (let r = 0; r < 9; r++) {
    const cells = [];
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const fixed = G.fixed[idx];
      const val = G.board[idx] || '';
      cells.push(
        <TouchableOpacity
          key={idx}
          onPress={() => moves.increment(idx)}
          onLongPress={() => moves.clear(idx)}
          style={{
            width: 30,
            height: 30,
            borderWidth: 1,
            borderColor: '#333',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: fixed ? '#ddd' : '#fff',
          }}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{val}</Text>
        </TouchableOpacity>
      );
    }
    rows.push(
      <View key={r} style={{ flexDirection: 'row' }}>
        {cells}
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {rows}
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Puzzle solved!</Text>
      )}
    </View>
  );
};

const SudokuClient = createGameClient({ game: SudokuGame, board: SudokuBoard });

export const Game = SudokuGame;
export const Board = SudokuBoard;
export const meta = { id: 'sudoku', title: 'Sudoku' };

export default SudokuClient;
