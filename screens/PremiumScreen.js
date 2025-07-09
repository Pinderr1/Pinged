import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import firebase from '../firebase';
import PropTypes from 'prop-types';

const featuresByPlan = {
  week: [
    'Unlimited invites for 7 days',
    'Premium badge on your profile',
    'All games unlocked',
  ],
  month: [
    'Unlimited game invites',
    'Premium badge on your profile',
    'All games unlocked',
    'Support new game development',
  ],
};

export default function PremiumScreen({ navigation }) {
  const [plan, setPlan] = useState('week');
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const startCheckout = async () => {
    try {
      const createSession = firebase
        .functions()
        .httpsCallable('createCheckoutSession');
      const result = await createSession({
        period: plan,
        successUrl: process.env.EXPO_PUBLIC_SUCCESS_URL,
        cancelUrl: process.env.EXPO_PUBLIC_CANCEL_URL,
      });
      const { url } = result.data || {};
      if (url) {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (e) {
      console.warn('Checkout failed', e);
    }
  };

  const features = featuresByPlan[plan];

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <ScreenContainer style={styles.container}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <View style={styles.toggleRow}>
          {['week', 'month'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.toggleOption, plan === p && styles.toggleActive]}
              onPress={() => setPlan(p)}
            >
              <Text
                style={[styles.toggleText, plan === p && styles.toggleTextActive]}
              >
                {p === 'week' ? '1 Week' : '1 Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.box}>
          {features.map((f, i) => (
            <Text key={i} style={styles.feature}>
              • {f}
            </Text>
          ))}
        </View>
        <GradientButton text="Continue" onPress={startCheckout} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Maybe Later</Text>
        </TouchableOpacity>
      </ScreenContainer>
    </GradientBackground>
  );
}

PremiumScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
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
      marginBottom: 20,
    },
    toggleRow: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 4,
      marginBottom: 20,
    },
    toggleOption: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 16,
    },
    toggleActive: {
      backgroundColor: theme.accent,
    },
    toggleText: {
      color: theme.textSecondary,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: '#fff',
    },
    box: {
      width: '100%',
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 12,
      marginBottom: 40,
    },
    feature: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 8,
    },
    cancel: {
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 16,
    },
  });
