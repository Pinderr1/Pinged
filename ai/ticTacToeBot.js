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

export function getBotMove(cells) {
  const available = cells
    .map((c, i) => (c === null ? i : null))
    .filter((v) => v !== null);
  if (available.length === 0) return null;
  // win if possible
  for (const idx of available) {
    const copy = [...cells];
    copy[idx] = '1';
    if (checkWinner(copy, '1')) return idx;
  }
  // block opponent win
  for (const idx of available) {
    const copy = [...cells];
    copy[idx] = '0';
    if (checkWinner(copy, '0')) return idx;
  }
  if (available.includes(4)) return 4;
  return available[Math.floor(Math.random() * available.length)];
}
