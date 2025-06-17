import React, { useEffect, useRef, useState } from 'react';
import { Client } from 'boardgame.io/react-native';
import { INVALID_MOVE } from 'boardgame.io/core';
import { View, Text, TouchableOpacity } from 'react-native';

const SIZE = 4;
const SEQ_LENGTH = 1000;

function generateSeq() {
  const arr = [];
  for (let i = 0; i < SEQ_LENGTH; i++) {
    arr.push(Math.random());
  }
  return arr;
}

function getEmpty(board) {
  const res = [];
  for (let i = 0; i < board.length; i++) if (board[i] === 0) res.push(i);
  return res;
}

function addTile(board, seq, index) {
  const empties = getEmpty(board);
  if (empties.length === 0) return index;
  const valueRand = seq[index % SEQ_LENGTH];
  const posRand = seq[(index + 1) % SEQ_LENGTH];
  const value = valueRand < 0.9 ? 2 : 4;
  const pos = empties[Math.floor(posRand * empties.length)];
  board[pos] = value;
  return index + 2;
}

function slideRow(row) {
  const arr = row.filter((v) => v !== 0);
  let score = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < SIZE) arr.push(0);
  return { row: arr, score };
}

function moveLeft(board) {
  let moved = false;
  let score = 0;
  const res = [];
  for (let r = 0; r < SIZE; r++) {
    const row = board.slice(r * SIZE, r * SIZE + SIZE);
    const { row: newRow, score: s } = slideRow(row);
    if (newRow.some((v, i) => v !== row[i])) moved = true;
    score += s;
    res.push(...newRow);
  }
  return { board: res, moved, score };
}

function reverseRows(board) {
  const res = [];
  for (let r = 0; r < SIZE; r++) {
    const row = board.slice(r * SIZE, r * SIZE + SIZE).reverse();
    res.push(...row);
  }
  return res;
}

function transpose(board) {
  const res = Array(board.length).fill(0);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      res[c * SIZE + r] = board[r * SIZE + c];
    }
  }
  return res;
}

function move(board, dir) {
  let b = board;
  if (dir === 'right') {
    b = reverseRows(b);
    const res = moveLeft(b);
    res.board = reverseRows(res.board);
    return res;
  } else if (dir === 'up') {
    b = transpose(b);
    const res = moveLeft(b);
    res.board = transpose(res.board);
    return res;
  } else if (dir === 'down') {
    b = transpose(reverseRows(b));
    const res = moveLeft(b);
    res.board = reverseRows(transpose(res.board));
    return res;
  }
  return moveLeft(b);
}

const Twenty48DuelGame = {
  setup: () => {
    const seq = generateSeq();
    const boards = { '0': Array(SIZE * SIZE).fill(0), '1': Array(SIZE * SIZE).fill(0) };
    const indices = { '0': 0, '1': 0 };
    for (const p of ['0', '1']) {
      indices[p] = addTile(boards[p], seq, indices[p]);
      indices[p] = addTile(boards[p], seq, indices[p]);
    }
    return { boards, indices, seq, scores: { '0': 0, '1': 0 }, finished: false };
  },
  moves: {
    move: ({ G, ctx }, dir) => {
      const p = ctx.playerID || ctx.currentPlayer;
      const { board, moved, score } = move(G.boards[p], dir);
      if (!moved) return INVALID_MOVE;
      G.boards[p] = board;
      G.scores[p] += score;
      G.indices[p] = addTile(G.boards[p], G.seq, G.indices[p]);
    },
    finish: ({ G }) => {
      G.finished = true;
    },
  },
  endIf: ({ G }) => {
    if (G.finished) {
      if (G.scores['0'] > G.scores['1']) return { winner: '0' };
      if (G.scores['1'] > G.scores['0']) return { winner: '1' };
      return { draw: true };
    }
  },
};

const Tile = ({ value }) => (
  <View
    style={{
      width: 60,
      height: 60,
      margin: 2,
      borderRadius: 4,
      backgroundColor: value ? '#facc15' : '#eee',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{value || ''}</Text>
  </View>
);

const Twenty48DuelBoard = ({ G, ctx, moves, playerID, onGameEnd }) => {
  const [time, setTime] = useState(120);
  const timer = useRef(null);
  const endRef = useRef(false);

  useEffect(() => {
    timer.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer.current);
          if (!endRef.current) moves.finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, []);

  useEffect(() => {
    if (ctx.gameover && !endRef.current) {
      endRef.current = true;
      onGameEnd && onGameEnd(ctx.gameover);
    }
  }, [ctx.gameover, onGameEnd]);

  const board = G.boards[playerID || '0'];
  const score = G.scores[playerID || '0'];
  const oppScore = G.scores[playerID === '0' ? '1' : '0'];

  const renderBoard = () => (
    <View style={{ width: SIZE * 64, flexDirection: 'row', flexWrap: 'wrap' }}>
      {board.map((v, i) => (
        <Tile key={i} value={v} />
      ))}
    </View>
  );

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ marginBottom: 6 }}>Time: {time}s</Text>
      <Text style={{ marginBottom: 6, fontWeight: 'bold' }}>
        Score: {score} | Opp: {oppScore}
      </Text>
      {renderBoard()}
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => moves.move('up')}
          style={{ padding: 6, margin: 4, backgroundColor: '#ccc', borderRadius: 4 }}
        >
          <Text>Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moves.move('left')}
          style={{ padding: 6, margin: 4, backgroundColor: '#ccc', borderRadius: 4 }}
        >
          <Text>Left</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moves.move('down')}
          style={{ padding: 6, margin: 4, backgroundColor: '#ccc', borderRadius: 4 }}
        >
          <Text>Down</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => moves.move('right')}
          style={{ padding: 6, margin: 4, backgroundColor: '#ccc', borderRadius: 4 }}
        >
          <Text>Right</Text>
        </TouchableOpacity>
      </View>
      {ctx.gameover && (
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
          {ctx.gameover.draw
            ? 'Draw!'
            : ctx.gameover.winner === playerID
            ? 'You win!'
            : 'You lose!'}
        </Text>
      )}
    </View>
  );
};

const Twenty48DuelClient = Client({ game: Twenty48DuelGame, board: Twenty48DuelBoard });

export const Game = Twenty48DuelGame;
export const Board = Twenty48DuelBoard;
export const meta = { id: 'twenty48Duel', title: '2048 Duel' };

export default Twenty48DuelClient;
