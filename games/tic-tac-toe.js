import React, { useEffect, useRef } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';

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

const BOARD_MARGIN = 40;
// Ensure the board width is evenly divisible by 3 so all cells fit without
// wrapping due to rounding errors on smaller screens. We first calculate an
// approximate board size based on the available width, then derive an integer
// cell size and recompute the final board size from that cell size.
const APPROX_BOARD_SIZE = Math.min(
  Dimensions.get('window').width - BOARD_MARGIN,
  300
);
const CELL_SIZE = Math.floor(APPROX_BOARD_SIZE / 3);
const BOARD_SIZE = CELL_SIZE * 3;

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
        <Text style={styles.statusText}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={styles.boardContainer}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2].map((col) => {
              const idx = row * 3 + col;
              const cell = G.cells[idx];
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => moves.clickCell(idx)}
                  disabled={disabled}
                  style={styles.cell}
                >
                  <Text style={[styles.mark, { fontSize: CELL_SIZE * 0.6 }] }>
                    {cell === '0' ? 'X' : cell === '1' ? 'O' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      {ctx.gameover && (
        <Text style={styles.resultText}>
          {resultText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    flexDirection: 'column',
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderWidth: 2,
    borderColor: '#d81b60',
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  mark: {
    fontWeight: 'bold',
  },
  statusText: { marginBottom: 12, fontWeight: 'bold' },
  resultText: { marginTop: 12, fontWeight: 'bold', fontSize: 18 },
});

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
