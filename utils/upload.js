import { storage } from '../firebase';

export async function uploadAvatarAsync(uri, uid) {
  if (!uri || !uid) throw new Error('uri and uid required');

  const response = await fetch(uri);
  const blob = await response.blob();

  // Store avatar inside a user specific folder so it matches storage.rules
  const avatarRef = storage.ref().child(`avatars/${uid}/avatar.jpg`);
  const uploadTask = avatarRef.put(blob);

  await new Promise((resolve, reject) => {
    uploadTask.on('state_changed', null, reject, resolve);
  });

  return avatarRef.getDownloadURL();
}
