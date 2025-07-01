export const computeMatchPercent = (a, b) => {
  if (!a || !b) return 0;
  let total = 0;
  let score = 0;

  if (Array.isArray(a.favoriteGames) && Array.isArray(b.favoriteGames)) {
    total += 1;
    if (a.favoriteGames.some((g) => b.favoriteGames.includes(g))) score += 1;
  }

  if (a.genderPref && b.gender) {
    total += 1;
    if (a.genderPref === 'Any' || a.genderPref === b.gender) score += 1;
  }

  if (b.genderPref && a.gender) {
    total += 1;
    if (b.genderPref === 'Any' || b.genderPref === a.gender) score += 1;
  }

  if (a.age && b.age) {
    total += 1;
    if (Math.abs(a.age - b.age) <= 3) score += 1;
  }

  if (total === 0) return 0;
  return Math.round((score / total) * 100);
};

export const computePriority = (user) => {
  if (!user) return 0;
  let score = user.priorityScore || 0;
  if (user.isPremium) score += 50;
  if (user.boostUntil) {
    const until = user.boostUntil.toDate?.() || new Date(user.boostUntil);
    if (until > new Date()) score += 100;
  }
  return score;
};

export const sortUsers = (currentUser, users = []) => {
  return users.sort((a, b) => {
    const pa = computePriority(a);
    const pb = computePriority(b);
    if (pb !== pa) return pb - pa;
    return (
      computeMatchPercent(currentUser, b) -
      computeMatchPercent(currentUser, a)
    );
  });
};
