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

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <BlurView intensity={80} tint="dark" style={styles.card}>
          <LottieView
            source={require('../assets/confetti.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
          <Text style={styles.title}>{`\uD83D\uDD25 ${streak}-Day Streak!`}</Text>
          <Text style={styles.subtitle}>Daily reward unlocked</Text>
          <Pressable
            onPress={onClose}
            android_ripple={{ color: theme.text }}
            style={styles.button}
          >
            <Text style={styles.btnText}>Awesome</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

StreakRewardModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  streak: PropTypes.number,
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
    card: {
      padding: 20,
      borderRadius: 20,
      width: 280,
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: theme.card,
    },
    animation: { width: 200, height: 200 },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    button: {
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 40,
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
