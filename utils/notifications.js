import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logDev } from './logger';

export async function registerForPushNotificationsAsync() {
  try {
    if (!Constants.isDevice) {
      logDev('Must use physical device for Push Notifications');
      return null;
    }

    if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
      logDev(
        'Remote push notifications are not supported in Expo Go on Android. Use a development build.'
      );
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logDev('Failed to get push token for push notification!');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (e) {
    console.warn('Push registration failed', e);
    return null;
  }
}
