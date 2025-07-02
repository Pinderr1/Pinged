import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const SIZE = 2; // 2x2 boxes

function indexH(row, col) {
  return row * SIZE + col;
}
function indexV(row, col) {
  return row * (SIZE + 1) + col;
}

const DotsBoxesGame = {
  setup: () => ({
    h: Array((SIZE + 1) * SIZE).fill(false),
    v: Array(SIZE * (SIZE + 1)).fill(false),
    boxes: Array(SIZE * SIZE).fill(null),
  }),
  moves: {
    drawH: ({ G, ctx }, row, col) => {
      const i = indexH(row, col);
      if (G.h[i]) return INVALID_MOVE;
      G.h[i] = ctx.currentPlayer;
      let scored = false;
      if (row > 0) {
        const box = indexH(row - 1, col);
      }
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const top = indexH(r, c);
          const bottom = indexH(r + 1, c);
          const left = indexV(r, c);
          const right = indexV(r, c + 1);
          if (
            G.h[top] &&
            G.h[bottom] &&
            G.v[left] &&
            G.v[right] &&
            !G.boxes[r * SIZE + c]
          ) {
            G.boxes[r * SIZE + c] = ctx.currentPlayer;
            scored = true;
          }
        }
      }
      if (!scored) ctx.events.endTurn();
    },
    drawV: ({ G, ctx }, row, col) => {
      const i = indexV(row, col);
      if (G.v[i]) return INVALID_MOVE;
      G.v[i] = ctx.currentPlayer;
      let scored = false;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const top = indexH(r, c);
          const bottom = indexH(r + 1, c);
          const left = indexV(r, c);
          const right = indexV(r, c + 1);
          if (
            G.h[top] &&
            G.h[bottom] &&
            G.v[left] &&
            G.v[right] &&
            !G.boxes[r * SIZE + c]
          ) {
            G.boxes[r * SIZE + c] = ctx.currentPlayer;
            scored = true;
          }
        }
      }
      if (!scored) ctx.events.endTurn();
    },
  },
  endIf: ({ G }) => {
    if (G.boxes.every(b => b !== null)) {
      const p0 = G.boxes.filter(b => b === '0').length;
      const p1 = G.boxes.filter(b => b === '1').length;
      if (p0 > p1) return { winner: '0' };
      if (p1 > p0) return { winner: '1' };
      return { draw: true };
    }
  },
};

const DotsBoxesBoard = ({ G, ctx, moves }) => {
  const rows = [];
  for (let r = 0; r <= SIZE; r++) {
    const cells = [];
    for (let c = 0; c < SIZE; c++) {
      const hIndex = indexH(r, c);
      const active = G.h[hIndex];
      cells.push(
        <TouchableOpacity
          key={'h' + r + '-' + c}
          onPress={() => moves.drawH(r, c)}
          style={{ width: 40, height: 10, backgroundColor: active ? 'black' : 'lightgray' }}
        />
      );
      if (c < SIZE) {
        const boxOwner = r < SIZE ? G.boxes[r * SIZE + c] : null;
        cells.push(
          <View key={'box' + r + '-' + c} style={{ width: 10, height: 10 }}>
            {boxOwner && <Text>{boxOwner === '0' ? 'A' : 'B'}</Text>}
          </View>
        );
      }
    }
    rows.push(
      <View key={'hr' + r} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 10, height: 10, backgroundColor: 'black' }} />
        {cells}
      </View>
    );
    if (r < SIZE) {
      const vRow = [];
      for (let c = 0; c <= SIZE; c++) {
        const vIndex = indexV(r, c);
        const active = G.v[vIndex];
        vRow.push(
          <TouchableOpacity
            key={'v' + r + '-' + c}
            onPress={() => moves.drawV(r, c)}
            style={{ width: 10, height: 40, backgroundColor: active ? 'black' : 'lightgray' }}
          />
        );
        if (c < SIZE) {
          vRow.push(<View key={'sp' + r + '-' + c} style={{ width: 40, height: 40 }} />);
        }
      }
      rows.push(<View key={'vr' + r} style={{ flexDirection: 'row' }}>{vRow}</View>);
    }
  }

  const status = ctx.gameover
    ? ctx.gameover.draw
      ? 'Draw game'
      : ctx.gameover.winner === '0'
      ? 'Player A wins!'
      : 'Player B wins!'
    : ctx.currentPlayer === '0'
    ? 'Player A turn'
    : 'Player B turn';

  return (
    <View style={{ padding: 10, alignItems: 'center' }}>
      <Text style={{ marginBottom: 10 }}>{status}</Text>
      {rows}
    </View>
  );
};

const DotsBoxesClient = createGameClient({ game: DotsBoxesGame, board: DotsBoxesBoard });

export const Game = DotsBoxesGame;
export const Board = DotsBoxesBoard;
export const meta = { id: 'dotsAndBoxes', title: 'Dots and Boxes' };

export default DotsBoxesClient;
