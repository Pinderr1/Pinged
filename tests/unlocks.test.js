const assert = require('assert');
const { computeUnlocks, LEVEL_UNLOCKS } = require('../utils/unlocks');

describe('computeUnlocks', () => {
  it('unlocks rewards based on level', () => {
    const xp = LEVEL_UNLOCKS[0].level * 100;
    const result = computeUnlocks({ xp });
    assert(result.includes(LEVEL_UNLOCKS[0].reward.id));
  });
});
