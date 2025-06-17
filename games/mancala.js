import React from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const PITS_PER_SIDE = 6;
const INITIAL_STONES = 4;

const setupPits = () => {
  const pits = Array(PITS_PER_SIDE * 2 + 2).fill(INITIAL_STONES);
  pits[PITS_PER_SIDE] = 0; // store for player 0
  pits[pits.length - 1] = 0; // store for player 1
  return { pits };
};

const playerStore = (player) =>
  player === '0' ? PITS_PER_SIDE : PITS_PER_SIDE * 2 + 1;
const opponentStore = (player) =>
  player === '0' ? PITS_PER_SIDE * 2 + 1 : PITS_PER_SIDE;
const isOwnPit = (player, idx) =>
  player === '0'
    ? idx >= 0 && idx < PITS_PER_SIDE
    : idx > PITS_PER_SIDE && idx < PITS_PER_SIDE * 2 + 1;

const MancalaGame = {
  setup: setupPits,
  moves: {
    sow: ({ G, ctx }, pit) => {
      if (!isOwnPit(ctx.currentPlayer, pit)) return INVALID_MOVE;
      let stones = G.pits[pit];
      if (stones === 0) return INVALID_MOVE;
      G.pits[pit] = 0;
      let idx = pit;
      while (stones > 0) {
        idx = (idx + 1) % G.pits.length;
        if (idx === opponentStore(ctx.currentPlayer)) continue;
        G.pits[idx]++;
        stones--;
      }
      if (
        idx !== playerStore(ctx.currentPlayer) &&
        isOwnPit(ctx.currentPlayer, idx) &&
        G.pits[idx] === 1 &&
        G.pits[G.pits.length - 2 - idx] > 0
      ) {
        const store = playerStore(ctx.currentPlayer);
        G.pits[store] += G.pits[G.pits.length - 2 - idx] + 1;
        G.pits[idx] = 0;
        G.pits[G.pits.length - 2 - idx] = 0;
      }
      if (idx !== playerStore(ctx.currentPlayer)) {
        ctx.events.endTurn();
      }
    },
  },
  endIf: ({ G }) => {
    const topEmpty = G.pits.slice(0, PITS_PER_SIDE).every((p) => p === 0);
    const bottomEmpty = G.pits
      .slice(PITS_PER_SIDE + 1, PITS_PER_SIDE * 2 + 1)
      .every((p) => p === 0);
    if (topEmpty || bottomEmpty) {
      const store0 = playerStore('0');
      const store1 = playerStore('1');
      if (!topEmpty) {
        for (let i = 0; i < PITS_PER_SIDE; i++) {
          G.pits[store0] += G.pits[i];
          G.pits[i] = 0;
        }
      }
      if (!bottomEmpty) {
        for (let i = PITS_PER_SIDE + 1; i < PITS_PER_SIDE * 2 + 1; i++) {
          G.pits[store1] += G.pits[i];
          G.pits[i] = 0;
        }
      }
      if (G.pits[store0] > G.pits[store1]) return { winner: '0' };
      if (G.pits[store1] > G.pits[store0]) return { winner: '1' };
      return { draw: true };
    }
  },
};

const Pit = ({ count, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#333',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      margin: 4,
    }}
  >
    <Text>{count}</Text>
  </TouchableOpacity>
);

const MancalaBoard = ({ G, ctx, moves, onGameEnd }) => {
  const endedRef = React.useRef(false);
  React.useEffect(() => {
    if (ctx.gameover && !endedRef.current) {
      endedRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const disabled = !!ctx.gameover;
  const yourTurn = ctx.currentPlayer === '0';

  const renderRow = (player) => {
    const pits = [];
    const start = player === '0' ? 0 : PITS_PER_SIDE + 1;
    const range = player === '0' ? [...Array(PITS_PER_SIDE).keys()] : [...Array(PITS_PER_SIDE).keys()].reverse();
    for (const i of range) {
      const idx = start + i;
      pits.push(
        <Pit
          key={idx}
          count={G.pits[idx]}
          onPress={() => moves.sow(idx)}
          disabled={disabled || ctx.currentPlayer !== player || G.pits[idx] === 0}
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{pits}</View>;
  };

  const store0 = G.pits[playerStore('0')];
  const store1 = G.pits[playerStore('1')];

  let resultText = '';
  if (ctx.gameover) {
    if (ctx.gameover.draw) {
      resultText = 'Draw';
    } else if (ctx.gameover.winner === '0') {
      resultText = 'You win!';
    } else {
      resultText = 'You lose!';
    }
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {yourTurn ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ alignItems: 'center', marginRight: 8 }}>
          <Text>Store</Text>
          <Pit count={store1} disabled onPress={() => {}} />
        </View>
        <View>
          {renderRow('1')}
          {renderRow('0')}
        </View>
        <View style={{ alignItems: 'center', marginLeft: 8 }}>
          <Text>Store</Text>
          <Pit count={store0} disabled onPress={() => {}} />
        </View>
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>{resultText}</Text>
      )}
    </View>
  );
};

const MancalaClient = Client({ game: MancalaGame, board: MancalaBoard });

export const Game = MancalaGame;
export const Board = MancalaBoard;
export const meta = { id: 'mancala', title: 'Mancala' };

export default MancalaClient;
