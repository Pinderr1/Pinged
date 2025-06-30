import React from 'react';
import { Animated, Text, StyleSheet, Dimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import useNotificationBanner from '../hooks/useNotificationBanner';

const screenWidth = Dimensions.get('window').width;

const NotificationCenter = ({ color }) => {
  const { theme } = useTheme();
  const { notification, isVisible, slideAnim } = useNotificationBanner();

  if (!isVisible) return null;

  const bannerColor = color || theme.accent;

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={[styles.inner, { backgroundColor: bannerColor }]}>
        <Ionicons name="notifications" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.text}>{notification}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    width: screenWidth,
    zIndex: 9999,
    alignItems: 'center'
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 50,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  }
});

export default NotificationCenter;
