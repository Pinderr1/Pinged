import { useEffect, useState } from 'react';
import firebase from '../firebase';

export default function useUserPresence(uid) {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    const unsub = firebase
      .firestore()
      .collection('presence')
      .doc(uid)
      .onSnapshot((doc) => {
        setPresence(doc.data() || null);
      });
    return () => unsub();
  }, [uid]);

  return presence;
}
