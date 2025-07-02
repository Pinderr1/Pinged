import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const SIZE = 10;

const GomokuGame = {
  setup: () => ({ cells: Array(SIZE * SIZE).fill(null) }),
  turn: { moveLimit: 1 },
  moves: {
    place: ({ G, ctx }, id) => {
      if (G.cells[id] !== null) return INVALID_MOVE;
      G.cells[id] = ctx.currentPlayer;
    },
  },
  endIf: ({ G }) => checkWinner(G.cells),
};

function checkWinner(cells) {
  const winCheck = (indices) => {
    const first = cells[indices[0]];
    if (first === null) return false;
    for (let i = 1; i < indices.length; i++) {
      if (cells[indices[i]] !== first) return false;
    }
    return { winner: first };
  };
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const i = r * SIZE + c;
      if (c <= SIZE - 5) {
        const res = winCheck([i, i + 1, i + 2, i + 3, i + 4]);
        if (res) return res;
      }
      if (r <= SIZE - 5) {
        const res = winCheck([i, i + SIZE, i + 2 * SIZE, i + 3 * SIZE, i + 4 * SIZE]);
        if (res) return res;
      }
      if (c <= SIZE - 5 && r <= SIZE - 5) {
        const res = winCheck([
          i,
          i + SIZE + 1,
          i + 2 * (SIZE + 1),
          i + 3 * (SIZE + 1),
          i + 4 * (SIZE + 1),
        ]);
        if (res) return res;
      }
      if (c >= 4 && r <= SIZE - 5) {
        const res = winCheck([
          i,
          i + SIZE - 1,
          i + 2 * (SIZE - 1),
          i + 3 * (SIZE - 1),
          i + 4 * (SIZE - 1),
        ]);
        if (res) return res;
      }
    }
  }
  if (cells.every((c) => c !== null)) return { draw: true };
}

const GomokuBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ width: SIZE * 30, height: SIZE * 30, flexDirection: 'row', flexWrap: 'wrap' }}>
        {G.cells.map((cell, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => moves.place(idx)}
            style={{
              width: 30,
              height: 30,
              borderWidth: 1,
              borderColor: '#333',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={!!ctx.gameover}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
              {cell === '0' ? '●' : cell === '1' ? '○' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
          {ctx.gameover.draw ? 'Draw' : ctx.gameover.winner === '0' ? 'You win!' : 'You lose!'}
        </Text>
      )}
    </View>
  );
};

const GomokuClient = createGameClient({ game: GomokuGame, board: GomokuBoard });

export const Game = GomokuGame;
export const Board = GomokuBoard;
export const meta = { id: 'gomoku', title: 'Gomoku' };

export default GomokuClient;
