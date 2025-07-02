import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

function createDeck(random) {
  const values = [2,3,4,5,6,7,8,9,10,10,10,10,11];
  const deck = [];
  for (let i = 0; i < 4; i++) {
    deck.push(...values);
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = random.Shuffle([...Array(i + 1).keys()])[0];
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(hand) {
  return hand.reduce((a, b) => a + b, 0);
}

const BlackjackGame = {
  setup: (ctx) => {
    const deck = createDeck(ctx.random);
    return {
      deck,
      hands: [ [deck.pop(), deck.pop()], [deck.pop(), deck.pop()] ],
      stand: [false, false],
    };
  },
  moves: {
    hit: ({ G, ctx }) => {
      const p = Number(ctx.currentPlayer);
      if (G.stand[p]) return INVALID_MOVE;
      const card = G.deck.pop();
      G.hands[p].push(card);
      if (handValue(G.hands[p]) > 21) {
        G.stand[p] = true;
        ctx.events.endTurn();
      }
    },
    stand: ({ G, ctx }) => {
      const p = Number(ctx.currentPlayer);
      if (G.stand[p]) return INVALID_MOVE;
      G.stand[p] = true;
      ctx.events.endTurn();
    },
  },
  endIf: ({ G }) => {
    if (!G.stand.every(Boolean)) return;
    const v0 = handValue(G.hands[0]);
    const v1 = handValue(G.hands[1]);
    const b0 = v0 > 21;
    const b1 = v1 > 21;
    if (b0 && b1) return { draw: true };
    if (b0) return { winner: '1' };
    if (b1) return { winner: '0' };
    if (v0 > v1) return { winner: '0' };
    if (v1 > v0) return { winner: '1' };
    return { draw: true };
  },
};

const BlackjackBoard = ({ G, ctx, moves, playerID, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const me = Number(playerID || '0');
  const opponent = 1 - me;

  const myHand = G.hands[me];
  const oppHand = G.hands[opponent];

  const disabled = ctx.currentPlayer !== String(me) || G.stand[me] || !!ctx.gameover;

  const renderHand = (hand) => hand.join(', ');

  let resultText = '';
  if (ctx.gameover) {
    if (ctx.gameover.draw) resultText = 'Draw';
    else if (ctx.gameover.winner === String(me)) resultText = 'You win!';
    else resultText = 'You lose!';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === String(me) ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <Text style={{ marginBottom: 6 }}>Opponent: {renderHand(oppHand)} ({handValue(oppHand)}) {G.stand[opponent] ? '(stand)' : ''}</Text>
      <Text style={{ marginBottom: 6 }}>You: {renderHand(myHand)} ({handValue(myHand)}) {G.stand[me] ? '(stand)' : ''}</Text>
      {!ctx.gameover && !G.stand[me] && (
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => moves.hit()}
            disabled={disabled}
            style={{ marginRight: 10, padding: 10, backgroundColor: '#4caf50', borderRadius: 4 }}
          >
            <Text style={{ color: '#fff' }}>Hit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => moves.stand()}
            disabled={disabled}
            style={{ padding: 10, backgroundColor: '#f44336', borderRadius: 4 }}
          >
            <Text style={{ color: '#fff' }}>Stand</Text>
          </TouchableOpacity>
        </View>
      )}
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>{resultText}</Text>
      )}
    </View>
  );
};

const BlackjackClient = createGameClient({ game: BlackjackGame, board: BlackjackBoard });

export const Game = BlackjackGame;
export const Board = BlackjackBoard;
export const meta = { id: 'blackjack', title: 'Blackjack' };

export default BlackjackClient;
