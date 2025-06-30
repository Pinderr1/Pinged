import { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { useUser } from '../contexts/UserContext';

export default function useUnreadNotifications() {
  const { user } = useUser();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    const q = firestore
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .where('read', '==', false);
    const unsub = q.onSnapshot((snap) => setCount(snap.size));
    return unsub;
  }, [user?.uid]);

  return count;
}
