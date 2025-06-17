import React, { useState, useEffect, useRef } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const SIZE = 8;

function initialBoard() {
  const board = Array(SIZE * SIZE).fill(null);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) {
        const idx = r * SIZE + c;
        if (r < 3) board[idx] = { player: '1', king: false };
        else if (r > 4) board[idx] = { player: '0', king: false };
      }
    }
  }
  return board;
}

function cloneBoard(board) {
  return board.map((p) => (p ? { ...p } : null));
}

const CheckersGame = {
  setup: () => ({ board: initialBoard() }),
  moves: {
    move: ({ G, ctx }, from, to) => {
      const b = G.board;
      if (!b[from] || b[to]) return INVALID_MOVE;
      const piece = b[from];
      if (piece.player !== ctx.currentPlayer) return INVALID_MOVE;
      const r0 = Math.floor(from / SIZE);
      const c0 = from % SIZE;
      const r1 = Math.floor(to / SIZE);
      const c1 = to % SIZE;
      const dr = r1 - r0;
      const dc = c1 - c0;
      if (Math.abs(dc) !== Math.abs(dr)) return INVALID_MOVE;
      if (Math.abs(dr) > 2 || Math.abs(dr) < 1) return INVALID_MOVE;
      if (!piece.king) {
        if (piece.player === '0' && dr >= 0) return INVALID_MOVE;
        if (piece.player === '1' && dr <= 0) return INVALID_MOVE;
      }
      if (Math.abs(dr) === 2) {
        const mr = (r0 + r1) / 2;
        const mc = (c0 + c1) / 2;
        const mid = mr * SIZE + mc;
        if (!b[mid] || b[mid].player === piece.player) return INVALID_MOVE;
        b[mid] = null;
      }
      b[from] = null;
      b[to] = piece;
      if ((piece.player === '0' && r1 === 0) || (piece.player === '1' && r1 === SIZE - 1)) {
        piece.king = true;
      }
      ctx.events.endTurn();
    },
  },
  endIf: ({ G }) => {
    let p0 = 0;
    let p1 = 0;
    for (const p of G.board) {
      if (p) {
        if (p.player === '0') p0++;
        else p1++;
      }
    }
    if (p0 === 0) return { winner: '1' };
    if (p1 === 0) return { winner: '0' };
  },
};

const Cell = ({ dark, children, onPress, selected }) => {
  const bg = dark ? '#769656' : '#eeeed2';
  const sel = selected ? { borderWidth: 2, borderColor: '#d81b60' } : {};
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, ...sel }}
    >
      {children}
    </TouchableOpacity>
  );
};

const Piece = ({ player, king }) => {
  const color = player === '0' ? '#d81b60' : '#000';
  return (
    <View
      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
    >
      {king && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>K</Text>}
    </View>
  );
};

const CheckersBoard = ({ G, ctx, moves, onGameEnd }) => {
  const [selected, setSelected] = useState(null);
  const endRef = useRef(false);
  useEffect(() => {
    if (ctx.gameover && !endRef.current) {
      endRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const handlePress = (idx) => {
    if (ctx.gameover) return;
    if (selected === null) {
      if (G.board[idx] && G.board[idx].player === ctx.currentPlayer) {
        setSelected(idx);
      }
    } else {
      if (selected === idx) {
        setSelected(null);
      } else {
        moves.move(selected, idx);
        setSelected(null);
      }
    }
  };

  let resultText = '';
  if (ctx.gameover) {
    resultText = ctx.gameover.winner === '0' ? 'You win!' : 'You lose!';
  }

  const rows = [];
  for (let r = 0; r < SIZE; r++) {
    const cells = [];
    for (let c = 0; c < SIZE; c++) {
      const idx = r * SIZE + c;
      const piece = G.board[idx];
      const dark = (r + c) % 2 === 1;
      cells.push(
        <Cell key={idx} dark={dark} onPress={() => handlePress(idx)} selected={selected === idx}>
          {piece && <Piece player={piece.player} king={piece.king} />}
        </Cell>
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

const CheckersClient = Client({ game: CheckersGame, board: CheckersBoard });

export const Game = CheckersGame;
export const Board = CheckersBoard;
export const meta = { id: 'checkers', title: 'Checkers' };

export default CheckersClient;
