export const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function indicesOf(arr, predicate) {
  const out = [];
  for (let i = 0; i < arr.length; i++) if (predicate(arr[i], i)) out.push(i);
  return out;
}

export function safeBot(botFn, fallbackFn) {
  return (G, player, game) => {
    try {
      const result = botFn(G, player, game);
      if (result !== null && result !== undefined) return result;
    } catch (err) {
      console.warn('Bot error:', err);
    }
    return fallbackFn ? fallbackFn(G, player, game) : null;
  };
}

import { INVALID_MOVE } from 'boardgame.io/core';
export function fallbackBot(G, player, game) {
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

  const valid = [];
  for (const [name, move] of Object.entries(game.moves)) {
    const arity = Math.max(0, move.length - 1);
    for (let attempt = 0; attempt < 20; attempt++) {
      const args = [];
      for (let i = 0; i < arity; i++) {
        args.push(Math.random() < 0.5 ? randomItem(numberPool) : randomItem(stringPool));
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
  return randomItem(valid);
}
