import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Image
} from 'react-native';
import GradientButton from '../components/GradientButton';
import GradientBackground from '../components/GradientBackground';
import * as WebBrowser from 'expo-web-browser';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import PropTypes from 'prop-types';

const upgradeFeatures = [
  { icon: require('../assets/icons/unlimited.png'), text: 'Unlimited Game Invites' },
  { icon: require('../assets/icons/boost.png'), text: 'Priority Swiping & Game Boosts' },
  { icon: require('../assets/icons/badge.png'), text: 'Exclusive Badges & Titles' },
  { icon: require('../assets/icons/filters.png'), text: 'Advanced Filters & Preferences' },
  { icon: require('../assets/icons/star.png'), text: 'Support New Game Events' }
];

const paywallFeatures = [
  { icon: require('../assets/icons/unlimited.png'), text: 'Unlimited Game Invites' },
  { icon: require('../assets/icons/boost.png'), text: 'Priority Swipes & Boosts' },
  { icon: require('../assets/icons/games.png'), text: 'All 100+ Games Unlocked' },
  { icon: require('../assets/icons/heart.png'), text: 'See Who Liked You' }
];

const PremiumScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const paywallStyles = getPaywallStyles(theme);
  const context = route?.params?.context || 'paywall';

  const startCheckout = async () => {
    try {
      const createSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createSession({
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

  if (context === 'upgrade') {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingBottom: 100 }}>
          <View style={upgradeStyles.container}>
            <Text style={upgradeStyles.title}>Upgrade to Premium</Text>
            <Text style={upgradeStyles.subtitle}>
              Play unlimited games, access all features, and support the Pinged community.
            </Text>
            <View style={upgradeStyles.featureList}>
              {upgradeFeatures.map((item, index) => (
                <View key={index} style={upgradeStyles.featureItem}>
                  <Image source={item.icon} style={upgradeStyles.featureIcon} />
                  <Text style={upgradeStyles.featureText}>{item.text}</Text>
                </View>
              ))}
            </View>
            <GradientButton
              text="Upgrade Now"
              icon={<Text style={{ fontSize: 16 }}>💎</Text>}
              onPress={startCheckout}
            />
            <Text style={upgradeStyles.legal}>
              1 free game/day included on free plan. Cancel anytime. All prices in CAD.
            </Text>
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <View style={paywallStyles.container}>
        <Text style={paywallStyles.title}>Upgrade to Premium</Text>
        <Text style={paywallStyles.subtitle}>More features. More matches. More fun.</Text>
        <FlatList
          data={paywallFeatures}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ marginTop: 24 }}
          renderItem={({ item }) => (
            <View style={paywallStyles.featureRow}>
              <Image source={item.icon} style={paywallStyles.icon} />
              <Text style={paywallStyles.featureText}>{item.text}</Text>
            </View>
          )}
        />
        <GradientButton
          text="Upgrade Now"
          onPress={startCheckout}
          marginVertical={40}
        />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={paywallStyles.cancel}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

const upgradeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 26,
    height: 26,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
  },
  legal: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
});

const getPaywallStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accent,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  cancel: {
    marginTop: 16,
    fontSize: 14,
    color: '#888',
  },
});

PremiumScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      context: PropTypes.string,
    }),
  }),
};

export default PremiumScreen;
