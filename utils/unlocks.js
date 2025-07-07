export const LEVEL_UNLOCKS = [
  { level: 2, reward: { type: 'theme', id: 'dark', name: 'Dark Theme' } },
  { level: 5, reward: { type: 'sticker', id: 'funPack', name: 'Fun Sticker Pack' } },
  { level: 8, reward: { type: 'game', id: 'checkers', name: 'Bonus Game: Checkers' } },
];

export function computeUnlocks({ xp = 0, unlocks = [] }) {
  const level = Math.floor(xp / 100);
  const set = new Set(unlocks);
  LEVEL_UNLOCKS.forEach((u) => {
    if (level >= u.level) set.add(u.reward.id);
  });
  return Array.from(set);
}

export function getNextUnlock(level = 0) {
  return LEVEL_UNLOCKS.find((u) => level < u.level);
}
