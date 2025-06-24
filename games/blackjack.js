import React from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

function handValue(hand) {
  return hand.reduce((a, b) => a + b, 0);
}

const BlackjackGame = {
  setup: () => ({ hands: [[], []], states: [0, 0] }), // 0 playing, 1 stand, 2 bust
  turn: { moveLimit: 1 },
  moves: {
    hit: ({ G, ctx }) => {
      const p = Number(ctx.currentPlayer);
      if (G.states[p] !== 0) return INVALID_MOVE;
      const card = ctx.random.D10();
      G.hands[p].push(card);
      if (handValue(G.hands[p]) > 21) {
        G.states[p] = 2;
        ctx.events.endTurn();
      }
    },
    stand: ({ G, ctx }) => {
      const p = Number(ctx.currentPlayer);
      if (G.states[p] !== 0) return INVALID_MOVE;
      G.states[p] = 1;
      ctx.events.endTurn();
    },
  },
  endIf: ({ G }) => {
    if (G.states.every(s => s !== 0)) {
      const v0 = handValue(G.hands[0]);
      const v1 = handValue(G.hands[1]);
      const bust0 = v0 > 21;
      const bust1 = v1 > 21;
      if (bust0 && bust1) return { draw: true };
      if (bust0) return { winner: '1' };
      if (bust1) return { winner: '0' };
      if (v0 > v1) return { winner: '0' };
      if (v1 > v0) return { winner: '1' };
      return { draw: true };
    }
  },
};

const Card = ({ value }) => (
  <View style={{ width: 30, height: 40, margin: 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{value}</Text>
  </View>
);

const Controls = ({ onHit, onStand, disabled }) => (
  <View style={{ flexDirection: 'row', marginVertical: 6 }}>
    <TouchableOpacity onPress={onHit} disabled={disabled} style={{ padding: 6, backgroundColor: '#ddd', marginRight: 8 }}>
      <Text>Hit</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onStand} disabled={disabled} style={{ padding: 6, backgroundColor: '#ddd' }}>
      <Text>Stand</Text>
    </TouchableOpacity>
  </View>
);

const BlackjackBoard = ({ G, ctx, moves }) => {
  const renderHand = (hand) => (
    <View style={{ flexDirection: 'row' }}>{hand.map((c, i) => <Card key={i} value={c} />)}</View>
  );

  const status = ctx.gameover
    ? ctx.gameover.draw
      ? 'Draw game'
      : ctx.gameover.winner === '0'
      ? 'Player A wins!'
      : 'Player B wins!'
    : ctx.currentPlayer === '0'
    ? 'Player A turn'
    : 'Player B turn';

  const disableHitStand = (player) => G.states[player] !== 0 || ctx.currentPlayer !== String(player) || ctx.gameover;

  return (
    <View style={{ alignItems: 'center', padding: 10 }}>
      <Text style={{ marginBottom: 10 }}>{status}</Text>
      <Text>Player A: {handValue(G.hands[0])}</Text>
      {renderHand(G.hands[0])}
      <Controls onHit={() => moves.hit()} onStand={() => moves.stand()} disabled={disableHitStand(0)} />
      <Text style={{ marginTop: 10 }}>Player B: {handValue(G.hands[1])}</Text>
      {renderHand(G.hands[1])}
      <Controls onHit={() => moves.hit()} onStand={() => moves.stand()} disabled={disableHitStand(1)} />
    </View>
  );
};

const BlackjackClient = Client({ game: BlackjackGame, board: BlackjackBoard });

export const Game = BlackjackGame;
export const Board = BlackjackBoard;
export const meta = { id: 'blackjack', title: 'Blackjack' };

export default BlackjackClient;
