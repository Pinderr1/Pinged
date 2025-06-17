import React, { useState, useRef, useEffect } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

const WORDS = ['apple', 'brick', 'crane', 'dread', 'flute', 'grace', 'honey'];

function evaluate(word, guess) {
  const res = Array(5).fill(0);
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guess[i] === word[i]) {
      res[i] = 2;
      used[i] = true;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 0) {
      for (let j = 0; j < 5; j++) {
        if (!used[j] && guess[i] === word[j]) {
          res[i] = 1;
          used[j] = true;
          break;
        }
      }
    }
  }
  return res;
}

const WordDuelGame = {
  setup: () => ({
    word: WORDS[Math.floor(Math.random() * WORDS.length)],
    guesses: [[], []],
  }),
  turn: { moveLimit: 1 },
  moves: {
    guess: ({ G, ctx }, value) => {
      const player = parseInt(ctx.currentPlayer, 10);
      const word = value.toLowerCase();
      if (word.length !== 5) return INVALID_MOVE;
      if (G.guesses[player].length >= 6) return INVALID_MOVE;
      G.guesses[player].push(word);
      ctx.events.endTurn();
    },
  },
  endIf: ({ G }) => {
    for (let i = 0; i < 2; i++) {
      const last = G.guesses[i][G.guesses[i].length - 1];
      if (last && last === G.word) return { winner: String(i) };
    }
    if (G.guesses[0].length >= 6 && G.guesses[1].length >= 6)
      return { draw: true };
  },
};

const tileColor = (status) => {
  if (status === 2) return '#66bb6a';
  if (status === 1) return '#ffa726';
  return '#bdbdbd';
};

const GuessRow = ({ word, pattern }) => (
  <View style={{ flexDirection: 'row', marginVertical: 2 }}>
    {word.split('').map((l, idx) => (
      <View
        key={idx}
        style={{
          width: 32,
          height: 32,
          margin: 2,
          borderRadius: 4,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tileColor(pattern[idx]),
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{l.toUpperCase()}</Text>
      </View>
    ))}
  </View>
);

const WordDuelBoard = ({ G, ctx, moves, onGameEnd }) => {
  const [input, setInput] = useState('');
  const endRef = useRef(false);
  useEffect(() => {
    if (ctx.gameover && !endRef.current) {
      endRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const player = parseInt(ctx.currentPlayer, 10);
  const yourGuesses = G.guesses[player];
  const oppGuesses = G.guesses[1 - player];

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ marginBottom: 10 }}>
        {yourGuesses.map((g, idx) => (
          <GuessRow key={idx} word={g} pattern={evaluate(G.word, g)} />
        ))}
      </View>
      <TextInput
        value={input}
        onChangeText={(t) => setInput(t)}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#333',
          width: 140,
          textAlign: 'center',
          marginBottom: 6,
        }}
        editable={!ctx.gameover && yourGuesses.length < 6}
      />
      <TouchableOpacity
        onPress={() => {
          moves.guess(input);
          setInput('');
        }}
        disabled={!!ctx.gameover || yourGuesses.length >= 6}
        style={{
          backgroundColor: '#d81b60',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
          marginBottom: 6,
        }}
      >
        <Text style={{ color: '#fff' }}>Guess</Text>
      </TouchableOpacity>
      <Text style={{ marginTop: 4 }}>
        Guesses left: {6 - yourGuesses.length}
      </Text>
      <View style={{ marginTop: 12 }}>
        {oppGuesses.map((g, idx) => (
          <GuessRow key={idx} word={g} pattern={evaluate(G.word, g)} />
        ))}
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
          {ctx.gameover.draw
            ? `Both failed! Word was ${G.word}`
            : ctx.gameover.winner === ctx.currentPlayer
            ? `You guessed it!`
            : `Opponent guessed it! Word was ${G.word}`}
        </Text>
      )}
    </View>
  );
};

const WordDuelClient = Client({ game: WordDuelGame, board: WordDuelBoard });

export const Game = WordDuelGame;
export const Board = WordDuelBoard;
export const meta = { id: 'wordDuel', title: 'Word Duel' };

export default WordDuelClient;
