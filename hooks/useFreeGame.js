import { useCallback } from 'react';
import firebase from '../firebase';
import { useUser } from '../contexts/UserContext';

export default function useFreeGame() {
  const { user, updateUser } = useUser();
  const freeGamesToday = user?.freeGamesToday || 0;

  const recordFreeGame = useCallback(async () => {
    if (!user?.uid) return;
    const newCount = freeGamesToday + 1;
    updateUser({ freeGamesToday: newCount });
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({ freeGamesToday: newCount });
    } catch (e) {
      console.warn('Failed to record free game', e);
    }
  }, [user?.uid, freeGamesToday, updateUser]);

  return { freeGamesToday, recordFreeGame };
}
