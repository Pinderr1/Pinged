import firebase from '../firebase';

export function initPresence(uid: string) {
  const db = firebase.database();
  const ref = db.ref(`/status/${uid}`);
  const isOffline = {
    state: 'offline',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };
  const isOnline = {
    state: 'online',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };

  db.ref('.info/connected').on('value', (snap) => {
    if (!snap.val()) return;
    ref.onDisconnect().set(isOffline).then(() => ref.set(isOnline));
  });
}
