export function versionToNumber(v = '') {
  const parts = String(v).split('.').map((n) => parseInt(n, 10) || 0);
  const [major = 0, minor = 0, patch = 0] = parts;
  return major * 1000000 + minor * 1000 + patch;
}

export function isVersionOutdated(current, minimum) {
  return versionToNumber(current) < versionToNumber(minimum);
}
