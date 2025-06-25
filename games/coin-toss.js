import React, { useEffect, useRef } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const CoinTossGame = {
  setup: () => ({ choice: null, result: null }),
  turn: { moveLimit: 1 },
  moves: {
    choose: ({ G }, guess) => {
      if (G.choice) return INVALID_MOVE;
      G.choice = guess;
      G.result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    },
  },
  endIf: ({ G }) => {
    if (G.result) {
      return { winner: G.choice === G.result ? '0' : '1' };
    }
  },
};

const CoinTossBoard = ({ G, ctx, moves, onGameEnd }) => {
  const endRef = useRef(false);
  useEffect(() => {
    if (ctx.gameover && !endRef.current) {
      endRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const disabled = !!G.choice;

  return (
    <View style={{ alignItems: 'center' }}>
      {!G.result && (
        <Text style={{ marginBottom: 10 }}>
          {ctx.currentPlayer === '0' ? 'Choose heads or tails' : 'Waiting...'}
        </Text>
      )}
      {!G.result && ctx.currentPlayer === '0' && (
        <View style={{ flexDirection: 'row' }}>
          {['Heads', 'Tails'].map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => moves.choose(opt)}
              disabled={disabled}
              style={{
                margin: 5,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: '#d81b60',
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff' }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {G.result && (
        <>
          <Text>Result: {G.result}</Text>
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
            {ctx.gameover.winner === '0' ? 'Player A wins!' : 'Player B wins!'}
          </Text>
        </>
      )}
    </View>
  );
};

const CoinTossClient = Client({ game: CoinTossGame, board: CoinTossBoard });

export const Game = CoinTossGame;
export const Board = CoinTossBoard;
export const meta = { id: 'coinToss', title: 'Coin Toss' };

export default CoinTossClient;
