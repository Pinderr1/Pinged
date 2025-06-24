import React from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const PITS = 6;
const START_STONES = 4;

function initBoard() {
  const pits = Array(PITS * 2).fill(START_STONES);
  const stores = [0, 0];
  return { pits, stores };
}

function opposite(index) {
  return PITS * 2 - 1 - index;
}

const MancalaGame = {
  setup: () => initBoard(),
  turn: { moveLimit: 1 },
  moves: {
    sow: ({ G, ctx }, index) => {
      const player = Number(ctx.currentPlayer);
      const start = player === 0 ? 0 : PITS;
      const end = start + PITS - 1;
      if (index < start || index > end) return INVALID_MOVE;
      let stones = G.pits[index];
      if (stones === 0) return INVALID_MOVE;
      G.pits[index] = 0;
      let i = index;
      while (stones > 0) {
        i = (i + 1) % (PITS * 2 + 2);
        if (i === (player === 0 ? PITS * 2 + 1 : PITS)) continue; // skip opponent store
        if (i === PITS * 2) {
          G.stores[0] += 1;
        } else if (i === PITS * 2 + 1) {
          G.stores[1] += 1;
        } else {
          G.pits[i % (PITS * 2)] += 1;
        }
        stones--;
      }
      const lastPit = i;
      const lastIndex = lastPit % (PITS * 2);
      if (
        lastPit !== PITS * 2 &&
        lastPit !== PITS * 2 + 1 &&
        ((player === 0 && lastIndex < PITS) || (player === 1 && lastIndex >= PITS)) &&
        G.pits[lastIndex] === 1 &&
        G.pits[opposite(lastIndex)] > 0
      ) {
        const captured = G.pits[opposite(lastIndex)] + 1;
        G.pits[opposite(lastIndex)] = 0;
        G.pits[lastIndex] = 0;
        G.stores[player] += captured;
      }
      if (lastPit !== (player === 0 ? PITS * 2 : PITS * 2 + 1)) {
        ctx.events.endTurn();
      }
    },
  },
  endIf: ({ G }) => {
    const p0Empty = G.pits.slice(0, PITS).every(p => p === 0);
    const p1Empty = G.pits.slice(PITS).every(p => p === 0);
    if (p0Empty || p1Empty) {
      const remaining0 = G.pits.slice(0, PITS).reduce((a, b) => a + b, 0);
      const remaining1 = G.pits.slice(PITS).reduce((a, b) => a + b, 0);
      G.stores[0] += remaining0;
      G.stores[1] += remaining1;
      G.pits.fill(0);
      if (G.stores[0] > G.stores[1]) return { winner: '0' };
      if (G.stores[1] > G.stores[0]) return { winner: '1' };
      return { draw: true };
    }
  },
};

const Pit = ({ stones, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{ width: 40, height: 40, margin: 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}
  >
    <Text>{stones}</Text>
  </TouchableOpacity>
);

const MancalaBoard = ({ G, ctx, moves }) => {
  const disabled = !!ctx.gameover;
  const player = Number(ctx.currentPlayer);
  const pits0 = G.pits.slice(0, PITS);
  const pits1 = G.pits.slice(PITS).slice().reverse();
  return (
    <View style={{ alignItems: 'center', padding: 10 }}>
      <Text style={{ marginBottom: 10 }}>
        {ctx.gameover
          ? ctx.gameover.draw
            ? 'Draw game'
            : ctx.gameover.winner === '0'
            ? 'Player A wins!'
            : 'Player B wins!'
          : ctx.currentPlayer === '0'
          ? 'Player A turn'
          : 'Player B turn'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ width: 40, textAlign: 'center' }}>{G.stores[1]}</Text>
        <View>
          <View style={{ flexDirection: 'row' }}>
            {pits1.map((s, idx) => (
              <Pit
                key={idx}
                stones={s}
                onPress={() => moves.sow(PITS + (PITS - 1 - idx))}
                disabled={disabled || player !== 1}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {pits0.map((s, idx) => (
              <Pit
                key={idx}
                stones={s}
                onPress={() => moves.sow(idx)}
                disabled={disabled || player !== 0}
              />
            ))}
          </View>
        </View>
        <Text style={{ width: 40, textAlign: 'center' }}>{G.stores[0]}</Text>
      </View>
    </View>
  );
};

const MancalaClient = Client({ game: MancalaGame, board: MancalaBoard });

export const Game = MancalaGame;
export const Board = MancalaBoard;
export const meta = { id: 'mancala', title: 'Mancala' };

export default MancalaClient;
