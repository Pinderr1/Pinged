import { useEffect, useState } from 'react';
import firebase from '../firebase';

export default function useUserPresence(uid) {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    const ref = firebase.database().ref(`/status/${uid}`);
    const handle = ref.on('value', (snap) => {
      setPresence(snap.val() || null);
    });
    return () => ref.off('value', handle);
  }, [uid]);

  return presence;
}
