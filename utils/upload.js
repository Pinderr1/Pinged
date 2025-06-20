import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export async function uploadAvatarAsync(uri, uid) {
  if (!uri || !uid) throw new Error('uri and uid required');

  const response = await fetch(uri);
  const blob = await response.blob();

  const avatarRef = ref(storage, `avatars/${uid}.jpg`);
  const uploadTask = uploadBytesResumable(avatarRef, blob);

  await new Promise((resolve, reject) => {
    uploadTask.on('state_changed', null, reject, resolve);
  });

  return getDownloadURL(avatarRef);
}
