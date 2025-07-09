import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import LottieView from 'lottie-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../contexts/ThemeContext';
import { BADGE_LIST } from '../utils/badges';
import { Ionicons } from '@expo/vector-icons';

export default function XpInfoModal({ visible, onClose }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const openLearnMore = () => {
    WebBrowser.openBrowserAsync('https://example.com/xp');
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LottieView
            source={require('../assets/confetti.json')}
            autoPlay
            loop={false}
            style={styles.anim}
          />
          <Text style={styles.title}>Daily Streaks & XP</Text>
          <Text style={styles.text}>
            Play every day to keep your streak alive and earn bonus XP. XP levels
            up your profile and unlocks badges.
          </Text>
          <View style={styles.badgeRow}>
            {BADGE_LIST.map((b) => (
              <Ionicons
                key={b.id}
                name={b.icon}
                size={20}
                color={theme.accent}
                style={styles.badgeIcon}
              />
            ))}
          </View>
          <TouchableOpacity onPress={openLearnMore} style={styles.linkButton}>
            <Text style={styles.link}>Learn more</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

XpInfoModal.propTypes = {
  visible: PropTypes.bool.isRequired,
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
      width: '100%',
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
    },
    anim: { width: 120, height: 80 },
    title: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 8 },
    text: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginVertical: 8,
    },
    badgeRow: { flexDirection: 'row', marginBottom: 8 },
    badgeIcon: { marginHorizontal: 4 },
    linkButton: { marginBottom: 12 },
    link: { color: theme.accent, textDecorationLine: 'underline' },
    button: {
      backgroundColor: theme.accent,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
  });
