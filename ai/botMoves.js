import { getBotMove as tttBot } from './ticTacToeBot';
import { getBotMove as rpsBot } from './rockPaperScissorsBot';
import { randomItem, fallbackBot, safeBot, indicesOf } from './botUtils';


export const bots = {
  ticTacToe: (G, player) => ({ move: 'clickCell', args: [tttBot(G.cells, player)] }),
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
    const col = randomItem(valid);
    return { move: 'drop', args: [col] };
  },
  gomoku: (G) => {
    const valid = indicesOf(G.cells, (v) => v === null);
    if (!valid.length) return null;
    const idx = randomItem(valid);
    return { move: 'place', args: [idx] };
  },
  battleship: (G, player) => {
    const hits = G.hits[Number(player)];
    const valid = indicesOf(hits, (v) => v === null);
    if (!valid.length) return null;
    const idx = randomItem(valid);
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
    return randomItem(moves);
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
    return randomItem(moves);
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
    return randomItem(moves);
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
    return randomItem(moves);
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
    const choice = randomItem(['Heads', 'Tails']);
    return { move: 'choose', args: [choice] };
  },
  memoryMatch: (G) => {
    const available = G.flipped
      .map((f, i) => (!f && !G.matched[i] ? i : null))
      .filter((v) => v !== null);
    if (!available.length) return null;
    if (G.selected.length === 1) {
      const first = G.selected[0];
      const match = G.deck.findIndex(
        (v, i) =>
          i !== first &&
          v === G.deck[first] &&
          !G.flipped[i] &&
          !G.matched[i]
      );
      if (match !== -1) return { move: 'flip', args: [match] };
    }
    const idx = randomItem(available);
    return { move: 'flip', args: [idx] };
  },
  hangman: (G) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const remaining = alphabet.filter((l) => !G.guesses.includes(l));
    if (!remaining.length) return null;
    const letter = randomItem(remaining);
    return { move: 'guess', args: [letter] };
  },
  minesweeper: (G) => {
    const unrevealed = G.revealed
      .map((v, i) => (!v && !G.flagged[i] ? i : null))
      .filter((v) => v !== null);
    if (!unrevealed.length) return null;
    if (Math.random() < 0.2) {
      const idx = randomItem(unrevealed);
      return { move: 'toggleFlag', args: [idx] };
    }
    const idx = randomItem(unrevealed);
    return { move: 'reveal', args: [idx] };
  },
  sudoku: (G) => {
    const choices = [];
    for (let i = 0; i < G.board.length; i++) {
      if (!G.fixed[i] && G.board[i] !== G.solution[i]) choices.push(i);
    }
    if (!choices.length) return null;
    const idx = randomItem(choices);
    return { move: 'increment', args: [idx] };
  },
  guessNumber: (G) => {
    const guessed = new Set(G.guesses.map((n) => String(n)));
    const options = [];
    for (let i = 1; i <= 100; i++) if (!guessed.has(String(i))) options.push(i);
    if (!options.length) return null;
    const val = randomItem(options);
    return { move: 'guess', args: [val] };
  },
  flirtyQuestions: () => ({ move: 'next', args: [] }),
};

export function getBotMove(key, G, player, game) {
  const bot = safeBot(bots[key] || fallbackBot, fallbackBot);
  return bot(G, player, game);
}
