export function computePriority(user = {}) {
  let score = user.priorityScore || 0;
  if (user.boostUntil) {
    const boostUntil = user.boostUntil.toDate?.() || new Date(user.boostUntil);
    if (boostUntil > new Date()) score += 1000;
  }
  return score;
}
