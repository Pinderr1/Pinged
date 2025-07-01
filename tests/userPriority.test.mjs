import assert from 'assert';
import { computeMatchPercent, sortUsers } from '../utils/userRanking.js';

const current = { genderPref: 'Any', gender: 'Male', favoriteGames: ['Chess'], age: 25 };

const premiumUser = {
  isPremium: true,
  priorityScore: 0,
  gender: 'Female',
  genderPref: 'Any',
  favoriteGames: ['Chess'],
  age: 25,
};

const normalUser = {
  isPremium: false,
  priorityScore: 20,
  gender: 'Female',
  genderPref: 'Any',
  favoriteGames: [],
  age: 25,
};

const boostedUser = {
  isPremium: false,
  priorityScore: 0,
  boostUntil: new Date(Date.now() + 100000),
  gender: 'Female',
  genderPref: 'Any',
  favoriteGames: [],
  age: 25,
};

// Premium should outrank normal despite lower priorityScore
let sorted = sortUsers(current, [normalUser, premiumUser]);
assert.strictEqual(sorted[0], premiumUser);

// Boosted should outrank premium
sorted = sortUsers(current, [premiumUser, boostedUser]);
assert.strictEqual(sorted[0], boostedUser);

// Match percent still calculable
assert.strictEqual(computeMatchPercent(current, premiumUser), 100);

console.log('All priority tests passed');

