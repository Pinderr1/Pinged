import { useEffect, useState } from 'react';
import firebase from '../firebase';

export default function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    const unsub = firebase
      .firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot((doc) => {
        setProfile(doc.data() || null);
      });
    return unsub;
  }, [uid]);

  return profile;
}
