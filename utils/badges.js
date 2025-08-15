export const BADGE_LIST = [
  {
    id: 'premiumMember',
    icon: 'diamond-outline',
    title: 'Premium Member',
    desc: 'Subscribed to Pinged Premium.',
    premium: true,
  },
  {
    id: 'firstWin',
    icon: 'trophy-outline',
    title: 'First Win',
    desc: 'Win your first game.',
  },
  {
    id: 'perfectGame',
    icon: 'star-outline',
    title: 'Perfect Game',
    desc: 'Win a match without mistakes.',
  },
  {
    id: 'dailyStreak',
    icon: 'flame-outline',
    title: 'Daily Streak',
    desc: 'Play 7 days in a row.',
  },
  {
    id: 'socialButterfly',
    icon: 'people-outline',
    title: 'Social Butterfly',
    desc: 'Join your first community event.',
  },
];

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
