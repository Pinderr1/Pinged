import { getBotMove as tttBot } from './ticTacToeBot';
import { getBotMove as rpsBot } from './rockPaperScissorsBot';
import { INVALID_MOVE } from 'boardgame.io/core';

function fallbackBot(G, player, game) {
  if (!game?.moves) return null;
  const base = JSON.parse(JSON.stringify(G));

  const numberPool = [];
  Object.values(G).forEach((val) => {
    if (Array.isArray(val)) {
      for (let i = 0; i < Math.min(val.length, 10); i++) {
        if (!numberPool.includes(i)) numberPool.push(i);
      }
    }
  });
  for (let i = 0; i < 10; i++) if (!numberPool.includes(i)) numberPool.push(i);

  const stringPool = [
    'left',
    'right',
    'up',
    'down',
    'a',
    'b',
    'c',
    'Heads',
    'Tails',
  ];

  const randFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const valid = [];

  for (const [name, move] of Object.entries(game.moves)) {
    const arity = Math.max(0, move.length - 1);
    for (let attempt = 0; attempt < 20; attempt++) {
      const args = [];
      for (let i = 0; i < arity; i++) {
        args.push(Math.random() < 0.5 ? randFrom(numberPool) : randFrom(stringPool));
      }
      const copy = JSON.parse(JSON.stringify(base));
      const ctx = {
        currentPlayer: String(player ?? '0'),
        random: { D6: () => Math.ceil(Math.random() * 6) },
        events: { endTurn: () => {} },
      };
      const res = move({ G: copy, ctx }, ...args);
      if (res !== INVALID_MOVE) {
        valid.push({ move: name, args });
        break;
      }
    }
  }

  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

export const bots = {
  ticTacToe: (G) => ({ move: 'clickCell', args: [tttBot(G.cells)] }),
  rps: () => ({ move: 'choose', args: [rpsBot()] }),
  connectFour: (G) => {
    const ROWS = 6;
    const COLS = 7;
    const valid = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = ROWS - 1; r >= 0; r--) {
        if (G.cells[r * COLS + c] === null) {
          valid.push(c);
          break;
        }
      }
    }
    if (!valid.length) return null;
    const col = valid[Math.floor(Math.random() * valid.length)];
    return { move: 'drop', args: [col] };
  },
  gomoku: (G) => {
    const valid = G.cells
      .map((v, i) => (v === null ? i : null))
      .filter((v) => v !== null);
    if (!valid.length) return null;
    const idx = valid[Math.floor(Math.random() * valid.length)];
    return { move: 'place', args: [idx] };
  },
  battleship: (G, player) => {
    const hits = G.hits[Number(player)];
    const valid = hits
      .map((v, i) => (v === null ? i : null))
      .filter((v) => v !== null);
    if (!valid.length) return null;
    const idx = valid[Math.floor(Math.random() * valid.length)];
    return { move: 'fire', args: [idx] };
  },
  checkers: (G, player, game) => {
    const SIZE = 8;
    const moves = [];
    for (let from = 0; from < SIZE * SIZE; from++) {
      const piece = G.board[from];
      if (!piece || !piece.startsWith(player)) continue;
      for (let to = 0; to < SIZE * SIZE; to++) {
        const copy = JSON.parse(JSON.stringify(G));
        const ctx = { currentPlayer: player, events: { endTurn: () => {} } };
        const res = game.moves.movePiece({ G: copy, ctx }, from, to);
        if (res !== 'INVALID_MOVE') {
          moves.push({ move: 'movePiece', args: [from, to] });
        }
      }
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  },
  dominoes: (G, player, game) => {
    const moves = [];
    const hand = G.hands[player];
    for (let i = 0; i < hand.length; i++) {
      ['left', 'right'].forEach((side) => {
        const copy = JSON.parse(JSON.stringify(G));
        const ctx = { currentPlayer: String(player), events: { endTurn: () => {} } };
        const res = game.moves.playTile({ G: copy, ctx }, i, side);
        if (res !== 'INVALID_MOVE') moves.push({ move: 'playTile', args: [i, side] });
      });
    }
    if (G.drawPile.length > 0) moves.push({ move: 'drawTile', args: [] });
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  },
  dotsAndBoxes: (G) => {
    const SIZE = 2;
    const moves = [];
    for (let r = 0; r <= SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const i = r * SIZE + c;
        if (!G.h[i]) moves.push({ move: 'drawH', args: [r, c] });
      }
    }
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c <= SIZE; c++) {
        const i = r * (SIZE + 1) + c;
        if (!G.v[i]) moves.push({ move: 'drawV', args: [r, c] });
      }
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  },
  snakesAndLadders: () => ({ move: 'roll', args: [] }),
  mancala: (G, player) => {
    const PITS = 6;
    const moves = [];
    if (player === '0') {
      for (let i = 0; i < PITS; i++) if (G.board[i] > 0) moves.push({ move: 'sow', args: [i] });
    } else {
      for (let i = 0; i < PITS; i++) if (G.board[PITS + 1 + i] > 0) moves.push({ move: 'sow', args: [i] });
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  },
  blackjack: (G, player) => {
    if (G.stand[Number(player)]) return null;
    return Math.random() < 0.5 ? { move: 'hit', args: [] } : { move: 'stand', args: [] };
  },
  nim: (G) => {
    const max = Math.min(3, G.remaining);
    const n = Math.floor(Math.random() * max) + 1;
    return { move: 'take', args: [n] };
  },
  pig: () => {
    return Math.random() < 0.5 ? { move: 'roll', args: [] } : { move: 'hold', args: [] };
  },
  coinToss: () => {
    const choice = Math.random() < 0.5 ? 'Heads' : 'Tails';
    return { move: 'choose', args: [choice] };
  },
};

export function getBotMove(key, G, player, game) {
  const bot = bots[key] || fallbackBot;
  return bot(G, player, game);
}
