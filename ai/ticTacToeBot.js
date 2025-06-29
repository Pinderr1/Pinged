import { indicesOf, randomItem } from './botUtils';

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(cells, player) {
  return lines.some(([a, b, c]) =>
    cells[a] === player && cells[b] === player && cells[c] === player
  );
}

export function getBotMove(cells, player = '1') {
  const opponent = player === '0' ? '1' : '0';
  const available = indicesOf(cells, (c) => c === null);
  if (!available.length) return null;
  for (const idx of available) {
    const copy = [...cells];
    copy[idx] = player;
    if (checkWinner(copy, player)) return idx;
  }
  for (const idx of available) {
    const copy = [...cells];
    copy[idx] = opponent;
    if (checkWinner(copy, opponent)) return idx;
  }
  if (available.includes(4)) return 4;
  return randomItem(available);
}
