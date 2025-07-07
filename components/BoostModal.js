import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import GradientButton from './GradientButton';

export default function BoostModal({
  visible,
  onClose,
  onStart,
  onPremium,
  trialUsed,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Boost Your Profile</Text>
          <Text style={styles.text}>
            Boosting makes you appear first in swipe results for 30 minutes.
          </Text>
          {trialUsed ? (
            <GradientButton
              text="Go Premium"
              onPress={onPremium}
              style={{ marginTop: 20 }}
            />
          ) : (
            <GradientButton
              text="Start Free Boost"
              onPress={onStart}
              style={{ marginTop: 20 }}
            />
          )}
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={styles.close}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

BoostModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onStart: PropTypes.func,
  onPremium: PropTypes.func,
  trialUsed: PropTypes.bool,
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
      width: '100%',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    text: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    close: {
      color: theme.textSecondary,
      fontSize: 14,
    },
  });
