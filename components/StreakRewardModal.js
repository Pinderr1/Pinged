import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

export default function StreakRewardModal({ visible, streak, onClose }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Streak Reward!</Text>
          <Text style={styles.text}>{`You reached a ${streak}-day streak!`}</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </View>
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
      padding: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      width: '80%',
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    text: {
      color: theme.text,
      fontSize: 16,
      marginBottom: 16,
      textAlign: 'center',
    },
    button: {
      backgroundColor: theme.accent,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
  });

