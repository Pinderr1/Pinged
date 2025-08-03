import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import firebase from '../firebase';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import PropTypes from 'prop-types';

export default function PremiumPaywallScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user } = useUser();
  const styles = getStyles(theme);

  const context = route?.params?.context || '';
  const messages = {
    'like-limit': {
      title: 'Daily Like Limit Reached',
      subtitle: 'You\u2019ve hit your daily like limit. Go Premium for unlimited likes.',
    },
    'game-limit': {
      title: 'Daily Game Limit Reached',
      subtitle: 'You\u2019ve hit your daily game limit. Upgrade to play all day.',
    },
    'premium-event': {
      title: 'Premium Event',
      subtitle: 'This event is for Premium members. Upgrade to join.',
    },
    'premium-feature': {
      title: 'Premium Feature',
      subtitle: 'This feature is exclusive to Premium members. Unlock it by upgrading.',
    },
  };
  const { title, subtitle } = messages[context] || messages['premium-feature'];

  const startCheckout = async () => {
    if (!user?.uid) return;
    try {
      const createSession = firebase
        .functions()
        .httpsCallable('createCheckoutSession');
      const result = await createSession({ uid: user.uid });
      const { url } = result.data || {};
      if (!url) return;
      if (Platform.OS === 'web') {
        const stripe = window.Stripe?.(
          process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        );
        if (stripe) {
          const sessionId = url.split('session_id=')[1];
          if (sessionId) {
            await stripe.redirectToCheckout({ sessionId });
          } else {
            window.location.assign(url);
          }
        } else {
          window.location.assign(url);
        }
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (e) {
      console.warn('Checkout failed', e);
      Toast.show({ type: 'error', text1: 'Checkout failed' });
    }
  };
  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <ScreenContainer style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <GradientButton
          text="Go Premium"
          onPress={() => navigation.replace('Premium')}
          style={{ marginTop: 20 }}
        />
        <GradientButton
          text="Subscribe"
          onPress={startCheckout}
          style={{ marginTop: 12 }}
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
  route: PropTypes.shape({
    params: PropTypes.shape({ context: PropTypes.string }),
  }),
};

PremiumPaywallScreen.defaultProps = {
  route: { params: { context: 'premium-feature' } },
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
