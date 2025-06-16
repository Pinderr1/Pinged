import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../contexts/UserContext';

export default function usePremiumStatus() {
  const { user, updateUser } = useUser();
  const [isPremium, setIsPremium] = useState(!!user?.isPremium);

  useEffect(() => {
    if (!user?.uid) {
      setIsPremium(false);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const val = snap.exists() ? !!snap.data().isPremium : false;
        setIsPremium(val);
        if (val !== user.isPremium) updateUser({ isPremium: val });
      },
      (err) => {
        console.warn('Premium status listener error', err);
        setIsPremium(false);
      }
    );
    return unsub;
  }, [user?.uid]);

  return isPremium;
}
