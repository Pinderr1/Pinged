import { useContext, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { NotificationContext } from '../contexts/NotificationContext';

export default function useNotificationBanner() {
  const { visible, notification } = useContext(NotificationContext);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
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
