import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';

export default function usePushNotifications() {
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging);
          console.log('FCM token', token);
        }
      } catch (e) {
        console.warn('Failed to get FCM token', e);
      }
    };
    requestPermission();
    const unsub = onMessage(messaging, (payload) => {
      console.log('Message received in foreground', payload);
    });
    return unsub;
  }, []);
}
