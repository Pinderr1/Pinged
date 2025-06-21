import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';

export default function usePushNotifications() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) return;
      registerForPushNotificationsAsync()
        .then((token) => {
          if (token) {
            updateDoc(doc(db, 'users', fbUser.uid), {
              expoPushToken: token,
            }).catch((e) => console.warn('Failed to save push token', e));
          }
        })
        .catch((e) => {
          console.warn('Failed to register for push notifications', e);
        });
    });
    return unsub;
  }, []);
}
