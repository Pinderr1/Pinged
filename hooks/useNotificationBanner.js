import { useContext, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NotificationContext } from '../contexts/NotificationContext';

export default function useNotificationBanner() {
  const { visible, notification } = useContext(NotificationContext);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Trigger a small vibration to draw attention to the banner
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 2500);
      });
    }
  }, [visible, slideAnim]);

  const isVisible = visible && notification;

  return { notification, isVisible, slideAnim };
}
