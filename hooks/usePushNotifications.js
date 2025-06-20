import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export default function usePushNotifications() {
  useEffect(() => {
    registerForPushNotificationsAsync().catch((e) => {
      console.warn('Failed to register for push notifications', e);
    });
  }, []);
}
