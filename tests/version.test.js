const assert = require('assert');
const { compareVersions, isVersionLess } = require('../utils/version');

describe('version utils', () => {
  it('compareVersions identifies greater version', () => {
    assert(compareVersions('1.2.0', '1.1.9') > 0);
  });

  it('isVersionLess works for minor versions', () => {
    assert(isVersionLess('1.0.0', '1.2.0'));
    assert(!isVersionLess('1.2.0', '1.2.0'));
  });
});
