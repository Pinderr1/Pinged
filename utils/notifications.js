import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(uid) {
  let token;
  if (!Constants.isDevice) {
    return;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  if (uid) {
    try {
      await setDoc(
        doc(db, 'users', uid),
        { pushToken: token },
        { merge: true }
      );
    } catch (e) {
      console.warn('Failed to save push token', e);
    }
  }
  return token;
}
