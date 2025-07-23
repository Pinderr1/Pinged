import { snapshotExists } from '../utils/firestore.js';

export const createLoginWithGoogle = ({
  promptAsync,
  firebase,
  ensureUserDoc,
  markOnboarded,
}) => {
  const handleGoogleResult = async (res) => {
    const { id_token } = res.params;
    const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
    const signIn = await firebase.auth().signInWithCredential(credential);
    await ensureUserDoc(signIn.user);
    try {
      const snap = await firebase
        .firestore()
        .collection('users')
        .doc(signIn.user.uid)
        .get();
      if (snapshotExists(snap) && snap.data().onboardingComplete) {
        markOnboarded();
      }
    } catch (e) {
      console.warn('Failed to fetch user doc', e);
    }
    return signIn.user;
  };

  return async () => {
    const res = await promptAsync({ useProxy: false, prompt: 'select_account' });
    if (res?.type === 'success') {
      return handleGoogleResult(res);
    }
    return null;
  };
};
