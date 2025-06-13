import React from 'react';
import { Client } from 'boardgame.io/react';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const TicTacToeGame = {
  setup: () => ({ cells: Array(9).fill(null) }),
  turn: { moveLimit: 1 },
  moves: {
    clickCell: ({ G, ctx }, id) => {
      if (G.cells[id] !== null) return INVALID_MOVE;
      G.cells[id] = ctx.currentPlayer;
    },
  },
};

const TicTacToeBoard = ({ G, ctx, moves }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 150 }}>
    {G.cells.map((cell, idx) => (
      <TouchableOpacity
        key={idx}
        onPress={() => moves.clickCell(idx)}
        style={{
          width: 50,
          height: 50,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 24 }}>
          {cell === '0' ? 'X' : cell === '1' ? 'O' : ''}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const TicTacToeClient = Client({
  game: TicTacToeGame,
  board: TicTacToeBoard,
});

export const meta = {
  id: 'ticTacToe',
  title: 'Tic Tac Toe',
};

export default TicTacToeClient;
