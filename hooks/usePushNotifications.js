import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useUser } from '../contexts/UserContext';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export default function usePushNotifications() {
  const { user } = useUser();

  useEffect(() => {
    if (user?.uid) {
      registerForPushNotificationsAsync(user.uid).catch(console.warn);
    }
  }, [user?.uid]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground', notification);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received', response);
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
}
