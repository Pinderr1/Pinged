import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';

export default function GameOverModal({ visible, winnerName, onRematch, onChat }) {
  useEffect(() => {
    if (visible && winnerName) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      // Play celebration sound here
    }
  }, [visible, winnerName]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {winnerName && (
            <LottieView
              source={require('../assets/confetti.json')}
              autoPlay
              loop={false}
              style={styles.animation}
            />
          )}
          <Text style={styles.emoji}>🏆</Text>
          <Text style={styles.title}>{winnerName ? `${winnerName} wins!` : 'Draw'}</Text>
          <TouchableOpacity style={styles.rematchBtn} onPress={onRematch}>
            <Text style={styles.rematchText}>Rematch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn} onPress={onChat}>
            <Text style={styles.chatText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

GameOverModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  winnerName: PropTypes.string,
  onRematch: PropTypes.func.isRequired,
  onChat: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#0009',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: 260,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  rematchBtn: {
    backgroundColor: '#28c76f',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginBottom: 12,
  },
  rematchText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatBtn: {
    backgroundColor: '#facc15',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  chatText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  animation: {
    position: 'absolute',
    top: -30,
    width: 200,
    height: 200,
  },
});
