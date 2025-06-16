import React from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const CoinFlipGame = {
  setup: () => ({ choices: [null, null], coin: null }),
  turn: { moveLimit: 1 },
  moves: {
    choose: ({ G, ctx }, choice) => {
      const player = parseInt(ctx.currentPlayer, 10);
      if (G.choices[player] !== null) return INVALID_MOVE;
      G.choices[player] = choice; // 0 = Heads, 1 = Tails
    },
  },
  endIf: ({ G }) => {
    if (G.choices[0] !== null && G.choices[1] !== null) {
      const coin = Math.random() < 0.5 ? 0 : 1;
      G.coin = coin;
      if (G.choices[0] === G.choices[1]) {
        return { draw: true };
      }
      if (G.choices[0] === coin) return { winner: '0' };
      if (G.choices[1] === coin) return { winner: '1' };
      return { draw: true };
    }
  },
};

const labels = ['Heads', 'Tails'];

const CoinFlipBoard = ({ G, ctx, moves, onGameEnd }) => {
  const endedRef = React.useRef(false);

  React.useEffect(() => {
    if (ctx.gameover && !endedRef.current) {
      endedRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const disabled = !!ctx.gameover;
  const yourChoice = G.choices[0];
  const oppChoice = G.choices[1];

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {labels.map((l, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => moves.choose(idx)}
            disabled={disabled || yourChoice !== null}
            style={{
              padding: 10,
              margin: 5,
              borderWidth: 1,
              borderColor: '#333',
              borderRadius: 6,
            }}
          >
            <Text>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text>Your choice: {yourChoice !== null ? labels[yourChoice] : '-'}</Text>
      <Text>Opponent: {oppChoice !== null ? labels[oppChoice] : '-'}</Text>
      {G.coin !== null && <Text>Coin: {labels[G.coin]}</Text>}
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
          {ctx.gameover.draw
            ? 'Draw!'
            : ctx.gameover.winner === '0'
            ? 'You win!'
            : 'You lose!'}
        </Text>
      )}
    </View>
  );
};

const CoinFlipClient = Client({ game: CoinFlipGame, board: CoinFlipBoard });

export const Game = CoinFlipGame;
export const Board = CoinFlipBoard;
export const meta = { id: 'coinFlip', title: 'Coin Flip' };

export default CoinFlipClient;
