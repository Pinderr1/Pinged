import React from 'react';
import createGameClient from './createGameClient';
import { View, Text, TouchableOpacity } from 'react-native';

const snakes = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const ladders = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

const SnakesLaddersGame = {
  setup: () => ({ positions: [1, 1], lastRoll: null }),
  turn: { moveLimit: 1 },
  moves: {
    roll: ({ G, ctx }) => {
      const roll = ctx.random.D6();
      G.lastRoll = roll;
      let pos = G.positions[ctx.currentPlayer] + roll;
      if (pos > 100) pos = 100;
      if (snakes[pos]) pos = snakes[pos];
      if (ladders[pos]) pos = ladders[pos];
      G.positions[ctx.currentPlayer] = pos;
    },
  },
  endIf: ({ G }) => {
    if (G.positions.some(p => p >= 100)) {
      const winner = G.positions[0] >= 100 ? '0' : '1';
      return { winner };
    }
  },
};

const cellStyle = { width: 30, height: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' };

const SnakesLaddersBoard = ({ G, ctx, moves }) => {
  const rows = [];
  for (let r = 9; r >= 0; r--) {
    const cells = [];
    for (let c = 0; c < 10; c++) {
      const num = r % 2 === 0 ? r * 10 + c + 1 : r * 10 + (9 - c) + 1;
      const tokens = [];
      if (G.positions[0] === num) tokens.push('A');
      if (G.positions[1] === num) tokens.push('B');
      cells.push(
        <View key={num} style={cellStyle}>
          <Text>{num}</Text>
          {tokens.map(t => (
            <Text key={t} style={{ fontWeight: 'bold' }}>{t}</Text>
          ))}
        </View>
      );
    }
    rows.push(
      <View key={r} style={{ flexDirection: 'row' }}>
        {cells}
      </View>
    );
  }
  const status = ctx.gameover
    ? ctx.gameover.winner === '0'
      ? 'Player A wins!'
      : 'Player B wins!'
    : ctx.currentPlayer === '0'
    ? 'Player A roll'
    : 'Player B wait';
  return (
    <View style={{ alignItems: 'center', padding: 10 }}>
      <Text style={{ marginBottom: 10 }}>{status}</Text>
      {rows}
      {!ctx.gameover && (
        <TouchableOpacity
          style={{ marginTop: 10, padding: 10, backgroundColor: '#ddd' }}
          onPress={() => moves.roll()}
        >
          <Text>Roll Dice</Text>
        </TouchableOpacity>
      )}
      {G.lastRoll && <Text style={{ marginTop: 10 }}>Rolled: {G.lastRoll}</Text>}
    </View>
  );
};

const SnakesLaddersClient = createGameClient({ game: SnakesLaddersGame, board: SnakesLaddersBoard });

export const Game = SnakesLaddersGame;
export const Board = SnakesLaddersBoard;
export const meta = { id: 'snakesAndLadders', title: 'Snakes & Ladders' };

export default SnakesLaddersClient;
