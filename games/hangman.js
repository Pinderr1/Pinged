import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const WORDS = ['react', 'native', 'expo', 'javascript', 'hangman'];

const HangmanGame = {
  setup: (ctx) => {
    const idx = ctx.random.Shuffle([...Array(WORDS.length).keys()])[0];
    const word = WORDS[idx].toLowerCase();
    return { word, guesses: [], wrong: 0 };
  },
  moves: {
    guess: ({ G }, letter) => {
      letter = letter.toLowerCase();
      if (G.guesses.includes(letter)) return INVALID_MOVE;
      G.guesses.push(letter);
      if (!G.word.includes(letter)) G.wrong++;
    },
  },
  endIf: ({ G }) => {
    const all = G.word.split('').every((l) => G.guesses.includes(l));
    if (all) return { winner: '0' };
    if (G.wrong >= 6) return { winner: '1' };
  },
};

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const HangmanBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const display = G.word
    .split('')
    .map((l) => (G.guesses.includes(l) ? l : '_'))
    .join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 24, letterSpacing: 2, marginBottom: 10 }}>{display}</Text>
      <Text style={{ marginBottom: 10 }}>Wrong guesses: {G.wrong}/6</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 300 }}>
        {alphabet.map((l) => (
          <TouchableOpacity
            key={l}
            onPress={() => moves.guess(l)}
            disabled={G.guesses.includes(l) || !!ctx.gameover}
            style={{
              width: 30,
              height: 30,
              margin: 2,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: '#333',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: G.guesses.includes(l) ? '#ddd' : '#fff',
            }}
          >
            <Text>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
          {ctx.gameover.winner === '0' ? 'You guessed it!' : 'You lose! Word was ' + G.word}
        </Text>
      )}
    </View>
  );
};

const HangmanClient = createGameClient({ game: HangmanGame, board: HangmanBoard });

export const Game = HangmanGame;
export const Board = HangmanBoard;
export const meta = { id: 'hangman', title: 'Hangman' };

export default HangmanClient;
