import { randomItem, clone } from './botUtils';

export const bots = [
  {
    id: 'ava',
    name: 'Ava',
    image: require('../assets/user1.jpg'),
    personality: 'friendly'
  },
  {
    id: 'zane',
    name: 'Zane',
    image: require('../assets/user2.jpg'),
    personality: 'competitive'
  },
  {
    id: 'leo',
    name: 'Leo',
    image: require('../assets/user3.jpg'),
    personality: 'sarcastic'
  }
];

export function getRandomBot() {
  return bots[Math.floor(Math.random() * bots.length)];
}

function isSafe(G, player, from, to, game) {
  const SIZE = 8;
  const opp = player === '0' ? '1' : '0';
  const copy = clone(G);
  const ctx = { currentPlayer: player, events: { endTurn: () => {} } };
  const res = game.moves.movePiece({ G: copy, ctx }, from, to);
  if (res === 'INVALID_MOVE') return false;
  const tr = Math.floor(to / SIZE);
  const tc = to % SIZE;
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [dr, dc] of directions) {
    const fr = tr + dr;
    const fc = tc + dc;
    if (fr < 0 || fr >= SIZE || fc < 0 || fc >= SIZE) continue;
    const idx = fr * SIZE + fc;
    const piece = copy.board[idx];
    if (!piece || !piece.startsWith(opp)) continue;
    const isKing = piece.endsWith('K');
    const dir = opp === '0' ? -1 : 1;
    if (isKing || Math.sign(dr) === dir) {
      const lr = tr + dr * 2;
      const lc = tc + dc * 2;
      if (lr >= 0 && lr < SIZE && lc >= 0 && lc < SIZE && copy.board[lr * SIZE + lc] === null) {
        return false;
      }
    }
  }
  return true;
}

export function getCheckersMove(G, player, game) {
  const SIZE = 8;
  const moves = [];
  const captures = [];
  for (let from = 0; from < SIZE * SIZE; from++) {
    const piece = G.board[from];
    if (!piece || !piece.startsWith(player)) continue;
    for (let to = 0; to < SIZE * SIZE; to++) {
      const copy = clone(G);
      const ctx = { currentPlayer: player, events: { endTurn: () => {} } };
      const res = game.moves.movePiece({ G: copy, ctx }, from, to);
      if (res !== 'INVALID_MOVE') {
        const fr = Math.floor(from / SIZE);
        const tr = Math.floor(to / SIZE);
        const isCapture = Math.abs(tr - fr) === 2;
        const promotes = !piece.endsWith('K') &&
          ((player === '0' && tr === 0) || (player === '1' && tr === SIZE - 1));
        const score = (isCapture ? 1 : 0) + (promotes ? 0.5 : 0);
        const move = { move: 'movePiece', args: [from, to], capture: isCapture, score };
        if (isCapture) captures.push(move);
        moves.push(move);
      }
    }
  }
  if (!moves.length) return null;
  if (captures.length) {
    let best = captures[0];
    for (const m of captures) if (m.score > best.score) best = m;
    return { move: 'movePiece', args: best.args };
  }
  const safe = moves.filter((m) => isSafe(G, player, m.args[0], m.args[1], game));
  const choice = safe.length ? randomItem(safe) : randomItem(moves);
  return { move: 'movePiece', args: choice.args };
}
