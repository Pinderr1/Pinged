import React, { useEffect } from 'react';
import { Modal, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { avatarSource } from '../utils/avatar';
import useWinLossStats from '../hooks/useWinLossStats';
import { useTheme } from '../contexts/ThemeContext';

export default function GameOverModal({
  visible,
  winnerName,
  winnerAvatar,
  winnerId,
  onRematch,
  rematchDisabled,
  onExit,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const stats = useWinLossStats(winnerId);
  useEffect(() => {
    if (visible && winnerName) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    }
  }, [visible, winnerName]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.animationContainer} pointerEvents="none">
          {winnerName && (
            <LottieView
              source={require('../assets/confetti.json')}
              autoPlay
              loop={false}
              style={styles.animation}
            />
          )}
        </View>
        <BlurView intensity={80} tint="dark" style={styles.card}>
          {winnerAvatar && (
            <Image source={avatarSource(winnerAvatar)} style={styles.avatar} />
          )}
          <Text style={styles.title}>
            {winnerName ? `${winnerName} wins!` : 'Draw'}
          </Text>
          {!stats.loading && (
            <Text style={styles.stats}>{`Wins: ${stats.wins}  Losses: ${stats.losses}`}</Text>
          )}
          <Pressable
            onPress={onRematch}
            android_ripple={{ color: theme.text }}
            style={[styles.rematchBtn, rematchDisabled && { opacity: 0.6 }]}
            disabled={rematchDisabled}
          >
            <Text style={styles.btnText}>Rematch</Text>
          </Pressable>
          <Pressable
            onPress={onExit}
            android_ripple={{ color: theme.text }}
            style={styles.exitBtn}
          >
            <Text style={styles.btnText}>Exit</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

GameOverModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  winnerName: PropTypes.string,
  winnerAvatar: PropTypes.any,
  winnerId: PropTypes.string,
  onRematch: PropTypes.func.isRequired,
  rematchDisabled: PropTypes.bool,
  onExit: PropTypes.func.isRequired,
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
    animation: {
      width: '100%',
      height: '100%',
    },
    card: {
      padding: 24,
      borderRadius: 20,
      width: 280,
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: theme.card,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    stats: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    rematchBtn: {
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderRadius: 16,
      width: '100%',
      marginBottom: 12,
      overflow: 'hidden',
    },
    exitBtn: {
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
