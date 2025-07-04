export function getProfileCompletion(user) {
  if (!user) return 0;
  const fields = [
    user.displayName,
    user.age,
    user.gender,
    user.genderPref,
    user.bio,
    user.location,
    Array.isArray(user.photos) ? user.photos.length > 0 : user.photoURL,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

