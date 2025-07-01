const assert = require('assert');
const { computePriority } = require('../utils/priority');

describe('computePriority', () => {
  it('uses priorityScore value', () => {
    assert(computePriority({ priorityScore: 5 }) > computePriority({ priorityScore: 1 }));
  });

  it('boosted users rank highest', () => {
    const now = Date.now();
    const boosted = computePriority({ boostUntil: new Date(now + 1000) });
    const regular = computePriority({ priorityScore: 100 });
    assert(boosted > regular);
  });
});
