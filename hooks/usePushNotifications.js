import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import firebase from '../firebase';
import { useNotification } from '../contexts/NotificationContext';

export default function usePushNotifications() {
  const { showNotification } = useNotification();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: false }),
    });

    const sub = Notifications.addNotificationReceivedListener((notification) => {
      try {
        const data = notification.request?.content?.data || {};
        let message = notification.request?.content?.body;
        if (data && data.type) {
          switch (data.type) {
            case 'match':
              message = "It's a match!";
              break;
            case 'chat':
              message = 'New message';
              break;
            case 'invite':
              message = 'Game invite received';
              break;
            default:
              break;
          }
        }
        if (message) {
          showNotification(message);
        }
      } catch (e) {
        console.warn('Failed to process incoming notification', e);
      }
    });

    return () => {
      sub.remove();
    };
  }, [showNotification]);
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
              .update({ pushToken: token })
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
