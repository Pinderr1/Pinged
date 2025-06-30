import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import firebase from '../firebase';

export default function usePushNotifications() {
  useEffect(() => {
    const unsub = firebase.auth().onAuthStateChanged((fbUser) => {
      if (!fbUser) return;
      registerForPushNotificationsAsync()
        .then((token) => {
          if (token) {
            firebase
              .firestore()
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
