import React from 'react';
import createGameClient from './createGameClient';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import useOnGameOver from '../hooks/useOnGameOver';

const PigGame = {
  setup: () => ({ scores: [0, 0], turnTotal: 0, lastRoll: null }),
  moves: {
    roll: ({ G, ctx }) => {
      const roll = ctx.random.D6();
      G.lastRoll = roll;
      if (roll === 1) {
        G.turnTotal = 0;
        ctx.events.endTurn();
      } else {
        G.turnTotal += roll;
      }
    },
    hold: ({ G, ctx }) => {
      G.scores[ctx.currentPlayer] += G.turnTotal;
      G.turnTotal = 0;
      ctx.events.endTurn();
    },
  },
  turn: {
    onBegin: ({ G }) => {
      G.turnTotal = 0;
      G.lastRoll = null;
    },
  },
  endIf: ({ G }) => {
    if (G.scores.some(s => s >= 50)) {
      const winner = G.scores[0] >= 50 ? '0' : '1';
      return { winner };
    }
  },
};

const PigBoard = ({ G, ctx, moves, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);
  const { theme } = useTheme();

  const disabled = !!ctx.gameover;
  const status = ctx.gameover
    ? ctx.gameover.winner === '0'
      ? 'Player A wins!'
      : 'Player B wins!'
    : ctx.currentPlayer === '0'
    ? 'Player A turn'
    : 'Player B turn';

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ marginBottom: 10 }}>{status}</Text>
      <Text>Scores - A: {G.scores[0]} B: {G.scores[1]}</Text>
      <Text style={{ marginVertical: 10 }}>Turn total: {G.turnTotal}</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => moves.roll()}
          disabled={disabled}
          style={{
            marginRight: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: theme.accent,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: '#fff' }}>Roll</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moves.hold()}
          disabled={disabled}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: theme.accent,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: '#fff' }}>Hold</Text>
        </TouchableOpacity>
      </View>
      {G.lastRoll && <Text>Last roll: {G.lastRoll}</Text>}
    </View>
  );
};

const PigClient = createGameClient({ game: PigGame, board: PigBoard });

export const Game = PigGame;
export const Board = PigBoard;
export const meta = { id: 'pig', title: 'Pig Dice' };

export default PigClient;
