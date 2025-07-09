import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';

export default function PremiumPaywallScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <ScreenContainer style={styles.container}>
        <Text style={styles.title}>Premium Feature</Text>
        <Text style={styles.subtitle}>
          Superlikes and Boosts are available for Premium members.
        </Text>
        <GradientButton
          text="Go Premium"
          onPress={() => navigation.replace('Premium')}
          style={{ marginTop: 20 }}
        />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Maybe Later</Text>
        </TouchableOpacity>
      </ScreenContainer>
    </GradientBackground>
  );
}

PremiumPaywallScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 80,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.accent,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: theme.text,
      textAlign: 'center',
      marginBottom: 40,
    },
    cancel: {
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 16,
    },
  });
