import React, { useEffect, useRef, useState } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const initialBoard = () => [
  'bR','bN','bB','bQ','bK','bB','bN','bR',
  'bP','bP','bP','bP','bP','bP','bP','bP',
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  'wP','wP','wP','wP','wP','wP','wP','wP',
  'wR','wN','wB','wQ','wK','wB','wN','wR',
];

const withinBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function pathClear(board, fr, fc, tr, tc) {
  const dr = Math.sign(tr - fr);
  const dc = Math.sign(tc - fc);
  let r = fr + dr;
  let c = fc + dc;
  while (r !== tr || c !== tc) {
    if (board[r * 8 + c]) return false;
    r += dr;
    c += dc;
  }
  return true;
}

function isLegal(board, from, to, player) {
  const piece = board[from];
  if (!piece) return false;
  const color = player === '0' ? 'w' : 'b';
  if (piece[0] !== color) return false;
  const target = board[to];
  if (target && target[0] === color) return false;
  const fr = Math.floor(from / 8);
  const fc = from % 8;
  const tr = Math.floor(to / 8);
  const tc = to % 8;
  const dr = tr - fr;
  const dc = tc - fc;
  switch (piece[1]) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const start = color === 'w' ? 6 : 1;
      if (dc === 0 && !target) {
        if (dr === dir) return true;
        if (dr === 2 * dir && fr === start && !board[from + dir * 8]) return true;
      }
      if (Math.abs(dc) === 1 && dr === dir && target) return true;
      return false;
    }
    case 'R':
      if (dr === 0 || dc === 0) return pathClear(board, fr, fc, tr, tc);
      return false;
    case 'B':
      if (Math.abs(dr) === Math.abs(dc)) return pathClear(board, fr, fc, tr, tc);
      return false;
    case 'Q':
      if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))
        return pathClear(board, fr, fc, tr, tc);
      return false;
    case 'N':
      return (
        (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
        (Math.abs(dr) === 1 && Math.abs(dc) === 2)
      );
    case 'K':
      return Math.max(Math.abs(dr), Math.abs(dc)) === 1;
    default:
      return false;
  }
}

const ChessGame = {
  setup: () => ({ board: initialBoard() }),
  moves: {
    move: ({ G, ctx }, from, to) => {
      if (!isLegal(G.board, from, to, ctx.currentPlayer)) return INVALID_MOVE;
      const piece = G.board[from];
      G.board[to] = piece;
      G.board[from] = null;
    },
  },
  endIf: ({ G }) => {
    const hasWhite = G.board.includes('wK');
    const hasBlack = G.board.includes('bK');
    if (!hasWhite) return { winner: '1' };
    if (!hasBlack) return { winner: '0' };
  },
};

const symbols = {
  wK: '♔',
  wQ: '♕',
  wR: '♖',
  wB: '♗',
  wN: '♘',
  wP: '♙',
  bK: '♚',
  bQ: '♛',
  bR: '♜',
  bB: '♝',
  bN: '♞',
  bP: '♟',
};

const ChessBoard = ({ G, ctx, moves, onGameEnd }) => {
  const endRef = useRef(false);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if (ctx.gameover && !endRef.current) {
      endRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const handlePress = (idx) => {
    if (ctx.gameover) return;
    if (selected === null) {
      const piece = G.board[idx];
      const color = ctx.currentPlayer === '0' ? 'w' : 'b';
      if (piece && piece[0] === color) setSelected(idx);
    } else {
      moves.move(selected, idx);
      setSelected(null);
    }
  };

  const rows = [];
  for (let r = 0; r < 8; r++) {
    const cells = [];
    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c;
      const piece = G.board[idx];
      const isSelected = selected === idx;
      const bg = (r + c) % 2 === 0 ? '#eee' : '#888';
      cells.push(
        <TouchableOpacity
          key={idx}
          onPress={() => handlePress(idx)}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected ? '#fdd835' : bg,
          }}
        >
          <Text style={{ fontSize: 24 }}>
            {piece ? symbols[piece] : ''}
          </Text>
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

const ChessClient = Client({ game: ChessGame, board: ChessBoard });

export const Game = ChessGame;
export const Board = ChessBoard;
export const meta = { id: 'chess', title: 'Chess' };

export default ChessClient;
