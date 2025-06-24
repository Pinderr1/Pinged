export function snapshotExists(snap) {
  if (!snap) return false;
  return typeof snap.exists === 'function' ? snap.exists() : snap.exists;
}

