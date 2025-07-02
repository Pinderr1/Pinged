import React, { useState } from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import useOnGameOver from '../hooks/useOnGameOver';

const SIZE = 8;

function initBoard() {
  const cells = Array(SIZE * SIZE).fill(null);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) {
        const idx = r * SIZE + c;
        if (r < 3) cells[idx] = '1';
        if (r > 4) cells[idx] = '0';
      }
    }
  }
  return cells;
}

const CheckersGame = {
  setup: () => ({ board: initBoard() }),
  turn: { moveLimit: 1 },
  moves: {
    movePiece: ({ G, ctx }, from, to) => {
      const piece = G.board[from];
      if (!piece) return INVALID_MOVE;
      if (!piece.startsWith(ctx.currentPlayer)) return INVALID_MOVE;
      if (G.board[to]) return INVALID_MOVE;

      const fr = Math.floor(from / SIZE);
      const fc = from % SIZE;
      const tr = Math.floor(to / SIZE);
      const tc = to % SIZE;
      const dr = tr - fr;
      const dc = tc - fc;
      const isKing = piece.endsWith('K');
      const dir = ctx.currentPlayer === '0' ? -1 : 1;

      if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
        if (!isKing && Math.sign(dr) !== dir) return INVALID_MOVE;
        G.board[to] = piece;
        G.board[from] = null;
      } else if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
        const mr = fr + dr / 2;
        const mc = fc + dc / 2;
        const mid = mr * SIZE + mc;
        const midPiece = G.board[mid];
        if (!midPiece || midPiece.startsWith(ctx.currentPlayer)) return INVALID_MOVE;
        if (!isKing && Math.sign(dr) !== dir) return INVALID_MOVE;
        G.board[to] = piece;
        G.board[from] = null;
        G.board[mid] = null;
      } else {
        return INVALID_MOVE;
      }

      if (!isKing) {
        if (ctx.currentPlayer === '0' && tr === 0) G.board[to] = '0K';
        if (ctx.currentPlayer === '1' && tr === SIZE - 1) G.board[to] = '1K';
      }
    },
  },
  endIf: ({ G }) => {
    const has0 = G.board.some((p) => p && p.startsWith('0'));
    const has1 = G.board.some((p) => p && p.startsWith('1'));
    if (!has0) return { winner: '1' };
    if (!has1) return { winner: '0' };
  },
};

const Square = ({ dark, piece, selected, onPress }) => {
  const { theme } = useTheme();
  const bg = dark ? '#b58863' : '#f0d9b5';
  const color = piece?.startsWith('0') ? theme.accent : '#000';
  const king = piece?.endsWith('K');
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {piece && (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: king ? 2 : 0,
            borderColor: '#fff',
          }}
        />
      )}
      {selected && (
        <View
          style={{
            position: 'absolute',
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: '#00f',
          }}
        />
      )}
    </TouchableOpacity>
  );
};

const CheckersBoard = ({ G, ctx, moves, onGameEnd }) => {
  const [selected, setSelected] = useState(null);
  useOnGameOver(ctx.gameover, onGameEnd);

  const handlePress = (idx) => {
    const piece = G.board[idx];
    if (selected === null) {
      if (piece && piece.startsWith(ctx.currentPlayer)) setSelected(idx);
    } else {
      if (idx === selected) {
        setSelected(null);
      } else {
        moves.movePiece(selected, idx);
        setSelected(null);
      }
    }
  };

  const rows = [];
  for (let r = 0; r < SIZE; r++) {
    const cells = [];
    for (let c = 0; c < SIZE; c++) {
      const idx = r * SIZE + c;
      const dark = (r + c) % 2 === 1;
      cells.push(
        <Square
          key={idx}
          dark={dark}
          piece={G.board[idx]}
          selected={selected === idx}
          onPress={() => handlePress(idx)}
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
    resultText = ctx.gameover.winner === '0' ? 'You win!' : 'You lose!';
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

const CheckersClient = createGameClient({ game: CheckersGame, board: CheckersBoard });

export const Game = CheckersGame;
export const Board = CheckersBoard;
export const meta = { id: 'checkers', title: 'Checkers' };

export default CheckersClient;
