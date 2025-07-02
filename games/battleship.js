import React from 'react';
import createGameClient from './createGameClient';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';
import useOnGameOver from '../hooks/useOnGameOver';

const SIZE = 5;
const SHIPS = [3, 2];

function placeShips(random) {
  const board = Array(SIZE * SIZE).fill(0);
  for (const len of SHIPS) {
    let placed = false;
    while (!placed) {
      const vertical = random.Shuffle([true, false])[0];
      const row = random.Shuffle(
        [...Array(vertical ? SIZE - len + 1 : SIZE).keys()]
      )[0];
      const col = random.Shuffle(
        [...Array(vertical ? SIZE : SIZE - len + 1).keys()]
      )[0];
      let canPlace = true;
      for (let i = 0; i < len; i++) {
        const r = row + (vertical ? i : 0);
        const c = col + (vertical ? 0 : i);
        if (board[r * SIZE + c] === 1) {
          canPlace = false;
          break;
        }
      }
      if (canPlace) {
        for (let i = 0; i < len; i++) {
          const r = row + (vertical ? i : 0);
          const c = col + (vertical ? 0 : i);
          board[r * SIZE + c] = 1;
        }
        placed = true;
      }
    }
  }
  return board;
}

const BattleshipGame = {
  setup: (ctx) => ({
    boards: [placeShips(ctx.random), placeShips(ctx.random)],
    hits: [Array(SIZE * SIZE).fill(null), Array(SIZE * SIZE).fill(null)],
  }),
  turn: { moveLimit: 1 },
  moves: {
    fire: ({ G, ctx }, idx) => {
      const player = Number(ctx.currentPlayer);
      const opponent = 1 - player;
      if (G.hits[player][idx] !== null) return INVALID_MOVE;
      const hit = G.boards[opponent][idx] === 1;
      G.hits[player][idx] = hit ? 'hit' : 'miss';
    },
  },
  endIf: ({ G }) => {
    const p0Win = G.boards[1].every((v, i) => v === 0 || G.hits[0][i] === 'hit');
    if (p0Win) return { winner: '0' };
    const p1Win = G.boards[0].every((v, i) => v === 0 || G.hits[1][i] === 'hit');
    if (p1Win) return { winner: '1' };
  },
};

const Cell = ({ value, onPress, disabled }) => {
  let bg = '#fff';
  if (value === 'hit') bg = '#e53935';
  else if (value === 'miss') bg = '#90caf9';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        margin: 2,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
      }}
    />
  );
};

const OwnCell = ({ ship, hit }) => {
  let bg = ship ? '#90a4ae' : '#fff';
  if (hit) bg = '#e53935';
  return (
    <View
      style={{
        width: 32,
        height: 32,
        margin: 2,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
      }}
    />
  );
};

const BattleshipBoard = ({ G, ctx, moves, playerID, onGameEnd }) => {
  useOnGameOver(ctx.gameover, onGameEnd);

  const player = Number(playerID || '0');
  const opponent = 1 - player;

  const disabled = ctx.currentPlayer !== String(player) || !!ctx.gameover;

  const renderGrid = (cells, renderCell) => {
    const rows = [];
    for (let r = 0; r < SIZE; r++) {
      const row = [];
      for (let c = 0; c < SIZE; c++) {
        const idx = r * SIZE + c;
        row.push(renderCell(idx));
      }
      rows.push(
        <View key={r} style={{ flexDirection: 'row' }}>
          {row}
        </View>
      );
    }
    return rows;
  };

  let resultText = '';
  if (ctx.gameover) {
    resultText = ctx.gameover.winner === String(player) ? 'You win!' : 'You lose!';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {!ctx.gameover && (
        <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>
          {ctx.currentPlayer === String(player) ? 'Your turn' : 'Waiting for opponent'}
        </Text>
      )}
      <Text style={{ marginBottom: 4, fontWeight: '600' }}>Fire</Text>
      {renderGrid(G.hits[player], (idx) => (
        <Cell key={idx} value={G.hits[player][idx]} onPress={() => moves.fire(idx)} disabled={disabled || G.hits[player][idx] !== null} />
      ))}
      <Text style={{ marginVertical: 6, fontWeight: '600' }}>Your Board</Text>
      {renderGrid(G.boards[player], (idx) => (
        <OwnCell key={idx} ship={G.boards[player][idx] === 1} hit={G.hits[opponent][idx] === 'hit'} />
      ))}
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>{resultText}</Text>
      )}
    </View>
  );
};

const BattleshipClient = createGameClient({ game: BattleshipGame, board: BattleshipBoard });

export const Game = BattleshipGame;
export const Board = BattleshipBoard;
export const meta = { id: 'battleship', title: 'Battleship' };

export default BattleshipClient;
