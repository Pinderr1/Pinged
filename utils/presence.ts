import firebase from '../firebase';

export async function initPresence(uid: string) {
  const db = firebase.database();
  const ref = db.ref(`/status/${uid}`);
  let profile: any = {};

  try {
    const snap = await firebase.firestore().collection('users').doc(uid).get();
    profile = snap.data() || {};
  } catch (e) {
    console.warn('Failed to load profile for presence', e);
  }

  const baseData = {
    photoURL: profile.photoURL || '',
    avatarOverlay: profile.avatarOverlay || '',
    xp: profile.xp || 0,
    streak: profile.streak || 0,
    badges: profile.badges || [],
    isPremium: !!profile.isPremium,
  };

  const isOffline = {
    state: 'offline',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };
  const isOnline = {
    state: 'online',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
    ...baseData,
  };

  const infoRef = db.ref('.info/connected');
  const handle = infoRef.on('value', (snap) => {
    if (!snap.val()) return;
    ref
      .onDisconnect()
      .update(isOffline)
      .then(() => ref.set(isOnline));
  });
  return () => infoRef.off('value', handle);
}
