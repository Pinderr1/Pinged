import React, { useState } from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import useOnGameOver from '../hooks/useOnGameOver';

const SIZE = 8;

function initBoard() {
  const board = Array(SIZE * SIZE).fill(null);
  const place = (row, pieces) => {
    for (let c = 0; c < SIZE; c++) board[row * SIZE + c] = pieces[c];
  };
  place(0, ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR']);
  place(1, Array(SIZE).fill('bP'));
  place(6, Array(SIZE).fill('wP'));
  place(7, ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']);
  return board;
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function applyMove(board, from, to) {
  const newBoard = [...board];
  newBoard[to] = newBoard[from];
  newBoard[from] = null;
  const piece = newBoard[to];
  if (piece && piece[1] === 'P') {
    const row = Math.floor(to / SIZE);
    if (piece[0] === 'w' && row === 0) newBoard[to] = 'wQ';
    if (piece[0] === 'b' && row === SIZE - 1) newBoard[to] = 'bQ';
  }
  return newBoard;
}

function getRawMoves(board, idx, color) {
  const piece = board[idx];
  if (!piece || piece[0] !== color) return [];
  const type = piece[1];
  const r = Math.floor(idx / SIZE);
  const c = idx % SIZE;
  const moves = [];
  const enemy = color === 'w' ? 'b' : 'w';

  const addSliding = (dr, dc) => {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const nidx = nr * SIZE + nc;
      const target = board[nidx];
      if (!target) {
        moves.push(nidx);
      } else {
        if (target[0] === enemy) moves.push(nidx);
        break;
      }
      nr += dr;
      nc += dc;
    }
  };

  switch (type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const fwd1r = r + dir;
      if (inBounds(fwd1r, c) && !board[fwd1r * SIZE + c]) {
        moves.push(fwd1r * SIZE + c);
        const fwd2r = r + 2 * dir;
        if (r === startRow && !board[fwd2r * SIZE + c]) {
          moves.push(fwd2r * SIZE + c);
        }
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const nidx = nr * SIZE + nc;
          const target = board[nidx];
          if (target && target[0] === enemy) moves.push(nidx);
        }
      }
      break;
    }
    case 'N': {
      const deltas = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (const [dr, dc] of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const nidx = nr * SIZE + nc;
        const target = board[nidx];
        if (!target || target[0] === enemy) moves.push(nidx);
      }
      break;
    }
    case 'B': {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => addSliding(dr, dc));
      break;
    }
    case 'R': {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => addSliding(dr, dc));
      break;
    }
    case 'Q': {
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(
        ([dr, dc]) => addSliding(dr, dc)
      );
      break;
    }
    case 'K': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const nidx = nr * SIZE + nc;
          const target = board[nidx];
          if (!target || target[0] === enemy) moves.push(nidx);
        }
      }
      break;
    }
  }
  return moves;
}

function isInCheck(board, color) {
  const kingIndex = board.findIndex((p) => p === color + 'K');
  if (kingIndex === -1) return true;
  const opponent = color === 'w' ? 'b' : 'w';
  for (let i = 0; i < board.length; i++) {
    const p = board[i];
    if (p && p[0] === opponent) {
      const moves = getRawMoves(board, i, opponent);
      if (moves.includes(kingIndex)) return true;
    }
  }
  return false;
}

function getLegalMoves(board, idx, color) {
  const raw = getRawMoves(board, idx, color);
  return raw.filter((to) => !isInCheck(applyMove(board, idx, to), color));
}

function hasAnyLegalMoves(board, color) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] && board[i][0] === color) {
      if (getLegalMoves(board, i, color).length > 0) return true;
    }
  }
  return false;
}

const ChessGame = {
  setup: () => ({ board: initBoard() }),
  turn: { moveLimit: 1 },
  moves: {
    movePiece: ({ G, ctx }, from, to) => {
      const color = ctx.currentPlayer === '0' ? 'w' : 'b';
      const piece = G.board[from];
      if (!piece || piece[0] !== color) return INVALID_MOVE;
      const legal = getLegalMoves(G.board, from, color);
      if (!legal.includes(to)) return INVALID_MOVE;
      const updated = applyMove(G.board, from, to);
      G.board = updated;
    },
  },
  endIf: ({ G }) => {
    const whiteKing = G.board.includes('wK');
    const blackKing = G.board.includes('bK');
    if (!whiteKing) return { winner: '1' };
    if (!blackKing) return { winner: '0' };
    const whiteMoves = hasAnyLegalMoves(G.board, 'w');
    const blackMoves = hasAnyLegalMoves(G.board, 'b');
    const whiteCheck = isInCheck(G.board, 'w');
    const blackCheck = isInCheck(G.board, 'b');
    if (!whiteMoves) {
      if (whiteCheck) return { winner: '1' };
      return { draw: true };
    }
    if (!blackMoves) {
      if (blackCheck) return { winner: '0' };
      return { draw: true };
    }
  },
};

const Square = ({ dark, piece, selected, highlight, onPress }) => {
  const { theme } = useTheme();
  const bg = highlight ? '#f7ec6e' : dark ? '#b58863' : '#f0d9b5';
  const color = piece?.startsWith('w') ? theme.accent : '#000';
  let icon = null;
  switch (piece?.[1]) {
    case 'P':
      icon = 'chess-pawn';
      break;
    case 'R':
      icon = 'chess-rook';
      break;
    case 'N':
      icon = 'chess-knight';
      break;
    case 'B':
      icon = 'chess-bishop';
      break;
    case 'Q':
      icon = 'chess-queen';
      break;
    case 'K':
      icon = 'chess-king';
      break;
  }
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
      {icon && <MaterialCommunityIcons name={icon} size={30} color={color} />}
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

const ChessBoard = ({ G, ctx, moves, onGameEnd }) => {
  const [selected, setSelected] = useState(null);
  const [valid, setValid] = useState([]);
  useOnGameOver(ctx.gameover, onGameEnd);

  const currentColor = ctx.currentPlayer === '0' ? 'w' : 'b';

  const handlePress = (idx) => {
    const piece = G.board[idx];
    if (selected === null) {
      if (piece && piece[0] === currentColor) {
        setSelected(idx);
        setValid(getLegalMoves(G.board, idx, currentColor));
      }
    } else {
      if (idx === selected) {
        setSelected(null);
        setValid([]);
      } else if (valid.includes(idx)) {
        moves.movePiece(selected, idx);
        setSelected(null);
        setValid([]);
      } else if (piece && piece[0] === currentColor) {
        setSelected(idx);
        setValid(getLegalMoves(G.board, idx, currentColor));
      } else {
        setSelected(null);
        setValid([]);
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
          highlight={valid.includes(idx)}
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

  let status = '';
  if (ctx.gameover) {
    if (ctx.gameover.winner === '0') status = 'You win!';
    else if (ctx.gameover.winner === '1') status = 'You lose!';
    else status = 'Draw!';
  } else {
    status = ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>{status}</Text>
      {rows}
    </View>
  );
};

const ChessClient = createGameClient({ game: ChessGame, board: ChessBoard });

export const Game = ChessGame;
export const Board = ChessBoard;
export const meta = { id: 'chess', title: 'Chess' };

export default ChessClient;
