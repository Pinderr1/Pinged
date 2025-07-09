import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import GradientButton from './GradientButton';

export default function BoostModal({
  visible,
  trialUsed = false,
  onActivate,
  onUpgrade,
  onClose,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Boost Your Profile</Text>
          <Text style={styles.desc}>
            Boosting puts you at the top of the deck for 30 minutes.
          </Text>
          {!trialUsed && (
            <Text style={styles.desc}>Enjoy one free boost to try it out!</Text>
          )}
          <GradientButton
            text={trialUsed ? 'Upgrade to Premium' : 'Activate Free Boost'}
            onPress={trialUsed ? onUpgrade : onActivate}
            style={{ marginTop: 12 }}
          />
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={styles.cancel}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

BoostModal.propTypes = {
  visible: PropTypes.bool,
  trialUsed: PropTypes.bool,
  onActivate: PropTypes.func.isRequired,
  onUpgrade: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      alignItems: 'center',
    },
    title: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    desc: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    cancel: { color: theme.accent },
  });
