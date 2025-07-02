import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const choices = ['Rock', 'Paper', 'Scissors'];

const RPSGame = {
  setup: () => ({ moves: [null, null] }),
  turn: { moveLimit: 1 },
  moves: {
    choose: ({ G, ctx }, choice) => {
      const player = parseInt(ctx.currentPlayer, 10);
      if (G.moves[player] !== null) return INVALID_MOVE;
      G.moves[player] = choice;
    },
  },
  endIf: ({ G }) => {
    if (G.moves[0] !== null && G.moves[1] !== null) {
      const [a, b] = G.moves;
      if (a === b) return { draw: true };
      if (
        (a === 0 && b === 2) ||
        (a === 1 && b === 0) ||
        (a === 2 && b === 1)
      )
        return { winner: '0' };
      return { winner: '1' };
    }
  },
};

const RPSBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const disabled = !!ctx.gameover;
  const yourChoice = G.moves[0];
  const oppChoice = G.moves[1];

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {choices.map((c, idx) => (
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
            <Text>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text>Your choice: {yourChoice !== null ? choices[yourChoice] : '-'}</Text>
      <Text>Opponent: {oppChoice !== null ? choices[oppChoice] : '-'}</Text>
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

const RPSClient = createGameClient({ game: RPSGame, board: RPSBoard });

export const Game = RPSGame;
export const Board = RPSBoard;
export const meta = { id: 'rockPaperScissors', title: 'Rock Paper Scissors' };

export default RPSClient;
