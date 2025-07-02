import React, { useState } from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import useOnGameOver from '../hooks/useOnGameOver';

function initTiles(random) {
  const tiles = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push([i, j]);
    }
  }
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = random.Shuffle([...Array(i + 1).keys()])[0];
    const tmp = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = tmp;
  }
  return tiles;
}

const DominoesGame = {
  setup: (ctx) => {
    const tiles = initTiles(ctx.random);
    const hands = {
      '0': tiles.slice(0, 7),
      '1': tiles.slice(7, 14),
    };
    return {
      hands,
      chain: [],
      drawPile: tiles.slice(14),
    };
  },
  turn: { moveLimit: 1 },
  moves: {
    playTile: ({ G, ctx }, index, side) => {
      const hand = G.hands[ctx.currentPlayer];
      const tile = hand[index];
      if (!tile) return INVALID_MOVE;
      if (G.chain.length === 0) {
        G.chain.push(tile);
        hand.splice(index, 1);
        return;
      }
      const leftVal = G.chain[0][0];
      const rightVal = G.chain[G.chain.length - 1][1];
      if (side === 'left') {
        if (tile[1] === leftVal) {
          G.chain.unshift([tile[0], tile[1]]);
          hand.splice(index, 1);
        } else if (tile[0] === leftVal) {
          G.chain.unshift([tile[1], tile[0]]);
          hand.splice(index, 1);
        } else {
          return INVALID_MOVE;
        }
      } else if (side === 'right') {
        if (tile[0] === rightVal) {
          G.chain.push([tile[0], tile[1]]);
          hand.splice(index, 1);
        } else if (tile[1] === rightVal) {
          G.chain.push([tile[1], tile[0]]);
          hand.splice(index, 1);
        } else {
          return INVALID_MOVE;
        }
      } else {
        return INVALID_MOVE;
      }
    },
    drawTile: ({ G, ctx }) => {
      if (G.drawPile.length === 0) return INVALID_MOVE;
      const tile = G.drawPile.pop();
      G.hands[ctx.currentPlayer].push(tile);
    },
  },
  endIf: ({ G, ctx }) => {
    if (G.hands[ctx.currentPlayer].length === 0) return { winner: ctx.currentPlayer };
  },
};

const DominoTile = ({ values, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      borderWidth: 1,
      borderColor: '#333',
      paddingHorizontal: 6,
      paddingVertical: 4,
      margin: 2,
      backgroundColor: selected ? '#ddd' : '#fff',
    }}
  >
    <Text>{`${values[0]}|${values[1]}`}</Text>
  </TouchableOpacity>
);

const DominoesBoard = ({ G, ctx, moves, onGameEnd }) => {
  const [selected, setSelected] = useState(null);
  useOnGameOver(ctx.gameover, onGameEnd);
  const { theme } = useTheme();

  const myHand = G.hands[ctx.currentPlayer];
  const disabled = !!ctx.gameover;

  let resultText = '';
  if (ctx.gameover) {
    if (ctx.gameover.winner === '0') resultText = 'You win!';
    else resultText = 'You lose!';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>
          {ctx.currentPlayer === '0' ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
        {G.chain.map((t, idx) => (
          <View
            key={idx}
            style={{ borderWidth: 1, borderColor: '#333', padding: 4, margin: 2 }}
          >
            <Text>{`${t[0]}|${t[1]}`}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        {myHand.map((t, idx) => (
          <DominoTile
            key={idx}
            values={t}
            selected={selected === idx}
            onPress={() => setSelected(idx)}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => {
            if (selected !== null) {
              moves.playTile(selected, 'left');
              setSelected(null);
            }
          }}
          disabled={selected === null || disabled}
          style={{ marginHorizontal: 6, padding: 6, backgroundColor: theme.accent, borderRadius: 4 }}
        >
          <Text style={{ color: '#fff' }}>Play Left</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (selected !== null) {
              moves.playTile(selected, 'right');
              setSelected(null);
            }
          }}
          disabled={selected === null || disabled}
          style={{ marginHorizontal: 6, padding: 6, backgroundColor: theme.accent, borderRadius: 4 }}
        >
          <Text style={{ color: '#fff' }}>Play Right</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moves.drawTile()}
          disabled={disabled || G.drawPile.length === 0}
          style={{ marginHorizontal: 6, padding: 6, backgroundColor: theme.accent, borderRadius: 4 }}
        >
          <Text style={{ color: '#fff' }}>Draw</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ marginBottom: 8 }}>Draw pile: {G.drawPile.length}</Text>
      {ctx.gameover && (
        <Text style={{ marginTop: 8, fontWeight: 'bold' }}>{resultText}</Text>
      )}
    </View>
  );
};

const DominoesClient = createGameClient({ game: DominoesGame, board: DominoesBoard });

export const Game = DominoesGame;
export const Board = DominoesBoard;
export const meta = { id: 'dominoes', title: 'Dominoes' };

export default DominoesClient;

