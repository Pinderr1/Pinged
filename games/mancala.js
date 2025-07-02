import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const PITS = 6;
const INIT_STONES = 4;

function initBoard() {
  const board = Array(2 * PITS + 2).fill(INIT_STONES);
  board[PITS] = 0; // store for player 0
  board[2 * PITS + 1] = 0; // store for player 1
  return board;
}

function opposite(idx) {
  return 2 * PITS - idx;
}

const MancalaGame = {
  setup: () => ({ board: initBoard(), current: 0 }),
  turn: { moveLimit: 1 },
  moves: {
    sow: ({ G, ctx }, pit) => {
      const isTop = ctx.currentPlayer === '1';
      const offset = isTop ? PITS + 1 : 0;
      const store = isTop ? 2 * PITS + 1 : PITS;
      const oppStore = isTop ? PITS : 2 * PITS + 1;
      const idx = offset + pit;
      let stones = G.board[idx];
      if (pit < 0 || pit >= PITS) return INVALID_MOVE;
      if (stones === 0) return INVALID_MOVE;
      if (ctx.currentPlayer === '0' && idx >= PITS && idx < 2 * PITS + 1)
        return INVALID_MOVE;
      if (ctx.currentPlayer === '1' && idx < PITS + 1)
        return INVALID_MOVE;
      G.board[idx] = 0;
      let pos = idx;
      while (stones > 0) {
        pos = (pos + 1) % (2 * PITS + 2);
        if (pos === oppStore) continue; // skip opponent store
        G.board[pos]++;
        stones--;
      }
      // capture
      const isOwnSide =
        ctx.currentPlayer === '0'
          ? pos >= 0 && pos < PITS
          : pos > PITS && pos < 2 * PITS + 1;
      if (isOwnSide && G.board[pos] === 1) {
        const opp = opposite(pos);
        const captured = G.board[opp];
        if (captured > 0) {
          G.board[store] += captured + 1;
          G.board[opp] = 0;
          G.board[pos] = 0;
        }
      }
      // extra turn?
      if (pos !== store) ctx.events.endTurn();
    },
  },
  endIf: ({ G, ctx }) => {
    const bottomEmpty = G.board.slice(0, PITS).every((x) => x === 0);
    const topEmpty = G.board.slice(PITS + 1, 2 * PITS + 1).every((x) => x === 0);
    if (bottomEmpty || topEmpty) {
      if (bottomEmpty) {
        for (let i = PITS + 1; i < 2 * PITS + 1; i++) {
          G.board[2 * PITS + 1] += G.board[i];
          G.board[i] = 0;
        }
      }
      if (topEmpty) {
        for (let i = 0; i < PITS; i++) {
          G.board[PITS] += G.board[i];
          G.board[i] = 0;
        }
      }
      const a = G.board[PITS];
      const b = G.board[2 * PITS + 1];
      let winner = a === b ? null : a > b ? '0' : '1';
      return { winner };
    }
  },
};

const Pit = ({ stones, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ width: 40, height: 40, margin: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }}
  >
    <Text>{stones}</Text>
  </TouchableOpacity>
);

const MancalaBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const disabled = !!ctx.gameover;

  const topRow = [];
  for (let i = PITS - 1; i >= 0; i--) {
    const idx = PITS + 1 + i;
    topRow.push(
      <Pit
        key={i}
        stones={G.board[idx]}
        onPress={() => moves.sow(i)}
        disabled={disabled}
      />
    );
  }

  const bottomRow = [];
  for (let i = 0; i < PITS; i++) {
    const idx = i;
    bottomRow.push(
      <Pit key={i} stones={G.board[idx]} onPress={() => moves.sow(i)} disabled={disabled} />
    );
  }

  let result = '';
  if (ctx.gameover) {
    if (ctx.gameover.winner === null) result = 'Draw';
    else if (ctx.gameover.winner === ctx.currentPlayer) result = 'You win!';
    else result = 'You lose!';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pit stones={G.board[2 * PITS + 1]} onPress={() => {}} disabled />
        <View>
          <View style={{ flexDirection: 'row' }}>{topRow}</View>
          <View style={{ flexDirection: 'row' }}>{bottomRow}</View>
        </View>
        <Pit stones={G.board[PITS]} onPress={() => {}} disabled />
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>{result}</Text>
      )}
    </View>
  );
};

const MancalaClient = createGameClient({ game: MancalaGame, board: MancalaBoard });

export const Game = MancalaGame;
export const Board = MancalaBoard;
export const meta = { id: 'mancala', title: 'Mancala' };

export default MancalaClient;
