import firebase from '../firebase';
import * as ImageManipulator from 'expo-image-manipulator';

async function detectCelebrityFace(uri) {
  try {
    // Placeholder for AI face detection service. In the future this
    // would call an external API and return true when a celebrity
    // face is recognized.
    return false;
  } catch (e) {
    console.error('Celebrity face check failed', e);
    return false;
  }
}

export async function uploadAvatarAsync(uri, uid) {
  if (!uri || !uid) throw new Error('uri and uid required');

  try {
    // Step 1: validate type from file extension
    const extMatch = uri.match(/\.(png|jpe?g)$/i);
    if (!extMatch) {
      console.error('Unsupported avatar format', uri);
      return null;
    }
    const finalExtension = extMatch[1].toLowerCase().replace('jpeg', 'jpg');

    // Step 2: load and compress image
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      {
        compress: 0.8,
        format:
          finalExtension === 'png'
            ? ImageManipulator.SaveFormat.PNG
            : ImageManipulator.SaveFormat.JPEG,
      }
    );
    const compressedRes = await fetch(compressed.uri);
    const compressedBlob = await compressedRes.blob();

    // Step 3: detect celebrity faces (stub)
    const isCelebrity = await detectCelebrityFace(uri);
    if (isCelebrity) {
      try {
        await firebase
          .firestore()
          .collection('users')
          .doc(uid)
          .set({ flaggedForReview: true }, { merge: true });
      } catch (err) {
        console.error('Failed to flag user for review', err);
      }
    }

    // Store avatar inside a user specific folder so it matches storage.rules
    // Step 4: upload processed avatar
    const avatarRef = firebase
      .storage()
      .ref()
      .child(`avatars/${uid}/avatar.${finalExtension}`);
    const uploadTask = avatarRef.put(compressedBlob);

    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, resolve);
    });

    return avatarRef.getDownloadURL();
  } catch (e) {
    console.error('Failed to upload avatar', e);
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
    console.error('Failed to upload voice message', e);
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
    console.error('Failed to upload voice intro', e);
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
    console.error('Failed to upload intro clip', e);
    return null;
  }
}
