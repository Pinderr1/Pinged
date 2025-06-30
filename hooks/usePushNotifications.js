import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function usePushNotifications() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) return;
      registerForPushNotificationsAsync()
        .then((token) => {
          if (token) {
            db
              .collection('users')
              .doc(fbUser.uid)
              .update({ expoPushToken: token })
              .catch((e) => console.warn('Failed to save push token', e));
          }
        })
        .catch((e) => {
          console.warn('Failed to register for push notifications', e);
        });
    });
    return unsub;
  }, []);
}
