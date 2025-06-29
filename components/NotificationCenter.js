import React, { useContext, useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions, View } from 'react-native';
import { NotificationContext } from '../contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const NotificationCenter = ({ color }) => {
  const { visible, notification } = useContext(NotificationContext);
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true
          }).start();
        }, 2500);
      });
    }
  }, [visible]);

  if (!visible || !notification) return null;

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
