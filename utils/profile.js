export function profileCompletion(user) {
  if (!user) return 0;
  const fields = ['displayName', 'age', 'gender', 'genderPref', 'bio', 'location'];
  let filled = fields.reduce((sum, f) => (user[f] ? sum + 1 : sum), 0);
  const hasPhotos = Array.isArray(user.photos)
    ? user.photos.length > 0
    : !!user.photoURL;
  if (hasPhotos) filled += 1;
  const total = fields.length + 1;
  return Math.round((filled / total) * 100);
}
