import React, { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

export default function StreakRewardModal({ visible, streak, onClose }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    }
  }, [visible]);
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.animationContainer} pointerEvents="none">
          <LottieView
            source={require('../assets/confetti.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
        </View>
        <BlurView intensity={80} tint="dark" style={styles.card}>
          <Text style={styles.title}>Streak Reward!</Text>
          <Text style={styles.text}>{`You reached a ${streak}-day streak!`}</Text>
          <Pressable onPress={onClose} android_ripple={{ color: theme.text }} style={styles.closeBtn}>
            <Text style={styles.btnText}>Awesome!</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

StreakRewardModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  streak: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: '#0009',
      justifyContent: 'center',
      alignItems: 'center',
    },
    animationContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    animation: { width: '100%', height: '100%' },
    card: {
      padding: 24,
      borderRadius: 20,
      width: 260,
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: theme.card,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    text: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    closeBtn: {
      backgroundColor: theme.accent,
      paddingVertical: 10,
      paddingHorizontal: 32,
      borderRadius: 16,
      width: '100%',
      overflow: 'hidden',
    },
    btnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      textAlign: 'center',
    },
  });
