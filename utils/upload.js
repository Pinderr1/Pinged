import firebase from '../firebase';

async function detectCelebrityFace(uri) {
  try {
    // Placeholder for AI face detection service. In the future this
    // would call an external API and return true when a celebrity
    // face is recognized.
    return false;
  } catch (e) {
    console.warn('Celebrity face check failed', e);
    return false;
  }
}

export async function uploadAvatarAsync(uri, uid) {
  if (!uri || !uid) throw new Error('uri and uid required');

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const isCelebrity = await detectCelebrityFace(uri);
    if (isCelebrity) {
      try {
        await firebase
          .firestore()
          .collection('users')
          .doc(uid)
          .set({ flaggedForReview: true }, { merge: true });
      } catch (err) {
        console.warn('Failed to flag user for review', err);
      }
    }

    // Store avatar inside a user specific folder so it matches storage.rules
    const avatarRef = firebase.storage().ref().child(`avatars/${uid}/avatar.jpg`);
    const uploadTask = avatarRef.put(blob);

    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, resolve);
    });

    return avatarRef.getDownloadURL();
  } catch (e) {
    console.warn('Failed to upload avatar', e);
    throw e;
  }
}

export async function uploadVoiceAsync(uri, uid) {
  if (!uri || !uid) throw new Error('uri and uid required');
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${Date.now()}.m4a`;
    const ref = firebase.storage().ref().child(`voiceMessages/${uid}/${filename}`);
    const uploadTask = ref.put(blob);
    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, resolve);
    });
    return ref.getDownloadURL();
  } catch (e) {
    console.warn('Failed to upload voice message', e);
    return null;
  }
}

export async function uploadIntroAsync(uri, uid) {
  if (!uri || !uid) throw new Error('uri and uid required');
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${Date.now()}.m4a`;
    const ref = firebase.storage().ref().child(`voiceIntros/${uid}/${filename}`);
    const uploadTask = ref.put(blob);
    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, resolve);
    });
    return ref.getDownloadURL();
  } catch (e) {
    console.warn('Failed to upload voice intro', e);
    return null;
  }
}

export async function uploadIntroClipAsync(uri, uid) {
  if (!uri || !uid) throw new Error('uri and uid required');
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const extMatch = uri.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : 'mp4';
    const filename = `${Date.now()}.${ext}`;
    const ref = firebase.storage().ref().child(`introClips/${uid}/${filename}`);
    const uploadTask = ref.put(blob);
    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, resolve);
    });
    return ref.getDownloadURL();
  } catch (e) {
    console.warn('Failed to upload intro clip', e);
    return null;
  }
}
