import React, { useEffect, useRef } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const TicTacToeGame = {
  setup: () => ({ cells: Array(9).fill(null) }),
  turn: { moveLimit: 1 },
  moves: {
    clickCell: ({ G, ctx }, id) => {
      if (G.cells[id] !== null) return INVALID_MOVE;
      G.cells[id] = ctx.currentPlayer;
    },
  },
  endIf: ({ G, ctx }) => {
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        G.cells[a] !== null &&
        G.cells[a] === G.cells[b] &&
        G.cells[a] === G.cells[c]
      ) {
        return { winner: G.cells[a] };
      }
    }
    if (G.cells.every((c) => c !== null)) {
      return { draw: true };
    }
  },
};

const TicTacToeBoard = ({ G, ctx, moves, onGameEnd }) => {
  const endedRef = useRef(false);

  useEffect(() => {
    if (ctx.gameover && !endedRef.current) {
      endedRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const disabled = !!ctx.gameover;

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
        <Text style={{ marginBottom: 12, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: 240,
          height: 240,
        }}
      >
        {G.cells.map((cell, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => moves.clickCell(idx)}
            disabled={disabled}
            style={{
              width: 80,
              height: 80,
              borderWidth: 1,
              borderColor: '#333',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: 'bold' }}>
              {cell === '0' ? 'X' : cell === '1' ? 'O' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 12, fontWeight: 'bold', fontSize: 18 }}>
          {resultText}
        </Text>
      )}
    </View>
  );
};

const TicTacToeClient = Client({
  game: TicTacToeGame,
  board: TicTacToeBoard,
});

export const Game = TicTacToeGame;
export const Board = TicTacToeBoard;
export const meta = {
  id: 'ticTacToe',
  title: 'Tic Tac Toe',
};

export default TicTacToeClient;
