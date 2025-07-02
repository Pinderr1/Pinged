import React, { useState } from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import useOnGameOver from '../hooks/useOnGameOver';

const GuessNumberGame = {
  setup: (ctx) => ({ target: ctx.random.Die(100), guesses: [] }),
  moves: {
    guess: ({ G }, value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return INVALID_MOVE;
      G.guesses.push(num);
    },
  },
  endIf: ({ G }) => {
    const last = G.guesses[G.guesses.length - 1];
    if (last === G.target) return { winner: '0' };
    if (G.guesses.length >= 10) return { winner: '1' };
  },
};

const GuessNumberBoard = ({ G, ctx, moves, onGameEnd }) => {
  const [input, setInput] = useState('');
  useOnGameOver(ctx.gameover, onGameEnd);
  const { theme } = useTheme();

  const last = G.guesses[G.guesses.length - 1];
  let hint = '';
  if (last !== undefined) {
    if (last < G.target) hint = 'Higher';
    else if (last > G.target) hint = 'Lower';
    else hint = 'Correct!';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Guess a number between 1 and 100</Text>
      <TextInput
        value={input}
        onChangeText={setInput}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          borderColor: '#333',
          width: 100,
          textAlign: 'center',
          marginVertical: 10,
        }}
      />
      <TouchableOpacity
        onPress={() => {
          moves.guess(input);
          setInput('');
        }}
        style={{ backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}
        disabled={!!ctx.gameover}
      >
        <Text style={{ color: '#fff' }}>Guess</Text>
      </TouchableOpacity>
      <Text style={{ marginTop: 10 }}>{hint}</Text>
      <Text style={{ marginTop: 10 }}>Attempts: {G.guesses.length}/10</Text>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
          {ctx.gameover.winner === '0'
            ? 'You guessed it!'
            : `Out of turns! Number was ${G.target}`}
        </Text>
      )}
    </View>
  );
};

const GuessNumberClient = createGameClient({ game: GuessNumberGame, board: GuessNumberBoard });

export const Game = GuessNumberGame;
export const Board = GuessNumberBoard;
export const meta = { id: 'guessNumber', title: 'Guess Number' };

export default GuessNumberClient;
