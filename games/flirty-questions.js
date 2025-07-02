import React from 'react';
import createGameClient from './createGameClient';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const QUESTIONS = [
  'What first attracted you to me?',
  'Describe your idea of a perfect date.',
  'What song would be on our couple playlist?',
  'If we could travel anywhere together, where would we go?',
  'What little gesture instantly makes you smile?',
  'What is a silly deal-breaker for you?',
  'Share a movie that gives you butterflies every time.',
  'What nickname would you give me?',
  'What hobby would you love to try with a partner?',
  'Favourite romantic comedy?'
];

const FlirtyGame = {
  setup: () => ({ index: 0 }),
  moves: {
    next: ({ G }) => {
      if (G.index < QUESTIONS.length - 1) {
        G.index += 1;
      }
    },
  },
  endIf: ({ G }) => {
    if (G.index >= QUESTIONS.length - 1) return { draw: true };
  },
};

const FlirtyBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
        {QUESTIONS[G.index]}
      </Text>
      {!ctx.gameover && (
        <TouchableOpacity
          onPress={() => moves.next()}
          style={{
            backgroundColor: '#ff75b5',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Next</Text>
        </TouchableOpacity>
      )}
      {ctx.gameover && (
        <Text style={{ marginTop: 20, fontWeight: 'bold' }}>
          All questions done!
        </Text>
      )}
    </View>
  );
};

const FlirtyClient = createGameClient({ game: FlirtyGame, board: FlirtyBoard });

export const Game = FlirtyGame;
export const Board = FlirtyBoard;
export const meta = { id: 'flirtyQuestions', title: 'Flirty Questions' };

export default FlirtyClient;
