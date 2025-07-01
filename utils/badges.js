import { BADGE_LIST } from '../data/badges';
export { BADGE_LIST };

export const BADGE_THRESHOLDS = {
  firstWin: { xp: 10 },
  perfectGame: { xp: 50 },
  dailyStreak: { streak: 7 },
};

export function computeBadges({ xp = 0, streak = 0, badges = [], isPremium }) {
  const unlocked = new Set(badges);
  if (isPremium) unlocked.add('premiumMember');
  Object.entries(BADGE_THRESHOLDS).forEach(([id, req]) => {
    if ((req.xp && xp >= req.xp) || (req.streak && streak >= req.streak)) {
      unlocked.add(id);
    }
  });
  return Array.from(unlocked);
}

export function getBadgeMeta(id) {
  return BADGE_LIST.find((b) => b.id === id);
}
