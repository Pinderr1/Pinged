import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const PAIRS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼'];
const SIZE = 4; // 4x4 grid


const MemoryMatchGame = {
  setup: (ctx) => ({
    deck: ctx.random.Shuffle([...PAIRS, ...PAIRS]),
    flipped: Array(16).fill(false),
    matched: Array(16).fill(false),
    selected: [],
  }),
  turn: { moveLimit: 2 },
  moves: {
    flip: ({ G, ctx }, idx) => {
      if (G.flipped[idx] || G.matched[idx] || G.selected.includes(idx)) return INVALID_MOVE;
      G.flipped[idx] = true;
      G.selected.push(idx);
      if (G.selected.length === 2) {
        const [a,b] = G.selected;
        if (G.deck[a] === G.deck[b]) {
          G.matched[a] = G.matched[b] = true;
        } else {
          G.flipped[a] = G.flipped[b] = false;
        }
        G.selected = [];
        ctx.events.endTurn();
      }
    },
  },
  endIf: ({ G }) => {
    if (G.matched.every(Boolean)) return { draw: true };
  },
};

const MemoryMatchBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ width: SIZE * 60, flexDirection: 'row', flexWrap: 'wrap' }}>
        {G.deck.map((val, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => moves.flip(idx)}
            style={{
              width: 60,
              height: 60,
              margin: 4,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#333',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: G.flipped[idx] || G.matched[idx] ? '#fff' : '#eee',
            }}
            disabled={!!ctx.gameover || G.flipped[idx] || G.matched[idx]}
          >
            {(G.flipped[idx] || G.matched[idx]) && (
              <Text style={{ fontSize: 24 }}>{val}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>All pairs found!</Text>
      )}
    </View>
  );
};

const MemoryMatchClient = createGameClient({ game: MemoryMatchGame, board: MemoryMatchBoard });

export const Game = MemoryMatchGame;
export const Board = MemoryMatchBoard;
export const meta = { id: 'memoryMatch', title: 'Memory Match' };

export default MemoryMatchClient;
