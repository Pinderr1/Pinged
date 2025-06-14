import React, { useRef, useEffect } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const PAIRS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼'];
const SIZE = 4; // 4x4 grid

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MemoryMatchGame = {
  setup: () => ({
    deck: shuffle([...PAIRS, ...PAIRS]),
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
  const endRef = useRef(false);
  useEffect(() => {
    if (ctx.gameover && !endRef.current) {
      endRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

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

const MemoryMatchClient = Client({ game: MemoryMatchGame, board: MemoryMatchBoard });

export const meta = { id: 'memoryMatch', title: 'Memory Match' };

export default MemoryMatchClient;
