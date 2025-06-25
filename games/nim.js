import React, { useEffect, useRef } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const NimGame = {
  setup: () => ({ remaining: 21 }),
  turn: { moveLimit: 1 },
  moves: {
    take: ({ G }, num) => {
      if (num < 1 || num > 3 || num > G.remaining) return INVALID_MOVE;
      G.remaining -= num;
    },
  },
  endIf: ({ G, ctx }) => {
    if (G.remaining <= 0) {
      return { winner: ctx.currentPlayer };
    }
  },
};

const NimBoard = ({ G, ctx, moves, onGameEnd }) => {
  const endRef = useRef(false);
  useEffect(() => {
    if (ctx.gameover && !endRef.current) {
      endRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const disabled = !!ctx.gameover;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ marginBottom: 10 }}>Stones remaining: {G.remaining}</Text>
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3].map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => moves.take(n)}
            disabled={disabled || n > G.remaining}
            style={{
              margin: 5,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: '#d81b60',
              borderRadius: 6,
            }}
          >
            <Text style={{ color: '#fff' }}>Take {n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
          {ctx.gameover.winner === '0' ? 'Player A wins!' : 'Player B wins!'}
        </Text>
      )}
    </View>
  );
};

const NimClient = Client({ game: NimGame, board: NimBoard });

export const Game = NimGame;
export const Board = NimBoard;
export const meta = { id: 'nim', title: 'Nim' };

export default NimClient;
