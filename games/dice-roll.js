import React from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const DiceRollGame = {
  setup: () => ({ rolls: [null, null] }),
  turn: { moveLimit: 1 },
  moves: {
    roll: ({ G, ctx }) => {
      const player = parseInt(ctx.currentPlayer, 10);
      if (G.rolls[player] !== null) return INVALID_MOVE;
      G.rolls[player] = Math.ceil(Math.random() * 6);
    },
  },
  endIf: ({ G }) => {
    if (G.rolls[0] !== null && G.rolls[1] !== null) {
      if (G.rolls[0] > G.rolls[1]) return { winner: '0' };
      if (G.rolls[0] < G.rolls[1]) return { winner: '1' };
      return { draw: true };
    }
  },
};

const DiceRollBoard = ({ G, ctx, moves, onGameEnd }) => {
  const endedRef = React.useRef(false);

  React.useEffect(() => {
    if (ctx.gameover && !endedRef.current) {
      endedRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const disabled = !!ctx.gameover;
  const yourRoll = G.rolls[0];
  const oppRoll = G.rolls[1];

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => moves.roll()}
        disabled={disabled || yourRoll !== null}
        style={{
          padding: 10,
          margin: 5,
          borderWidth: 1,
          borderColor: '#333',
          borderRadius: 6,
          backgroundColor: '#d81b60',
        }}
      >
        <Text style={{ color: '#fff' }}>Roll</Text>
      </TouchableOpacity>
      <Text>Your roll: {yourRoll !== null ? yourRoll : '-'}</Text>
      <Text>Opponent: {oppRoll !== null ? oppRoll : '-'}</Text>
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

const DiceRollClient = Client({ game: DiceRollGame, board: DiceRollBoard });

export const Game = DiceRollGame;
export const Board = DiceRollBoard;
export const meta = { id: 'diceRoll', title: 'Dice Roll' };

export default DiceRollClient;
