import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import GradientButton from './GradientButton';

export default function StreakRewardModal({ visible, onClose, streak }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!visible) return null;
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Streak Reward!</Text>
          <Text style={styles.text}>{`You reached a ${streak}-day streak!`}</Text>
          <GradientButton text="Awesome" onPress={onClose} width={150} />
        </View>
      </View>
    </Modal>
  );
}

StreakRewardModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  streak: PropTypes.number.isRequired,
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
    },
    title: { color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    text: { color: theme.text, fontSize: 16, marginBottom: 12, textAlign: 'center' },
  });
