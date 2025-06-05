// /screens/PremiumScreen.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';

const PremiumScreen = () => {
  const { darkMode } = useTheme();

  const features = [
    { icon: require('../assets/icons/unlimited.png'), text: 'Unlimited Game Invites' },
    { icon: require('../assets/icons/boost.png'), text: 'Priority Swiping & Game Boosts' },
    { icon: require('../assets/icons/badge.png'), text: 'Exclusive Badges & Titles' },
    { icon: require('../assets/icons/filters.png'), text: 'Advanced Filters & Preferences' },
    { icon: require('../assets/icons/star.png'), text: 'Support New Game Events' }
  ];

  return (
    <LinearGradient
      colors={darkMode ? ['#121212', '#1e1e1e'] : ['#fff', '#ffe6f0']}
      style={{ flex: 1 }}
    >
      <Header />

      <ScrollView contentContainerStyle={{ paddingTop: 80, paddingBottom: 100 }}>
        <View style={local.container}>
          <Text style={local.title}>Upgrade to Premium</Text>
          <Text style={local.subtitle}>Play unlimited games, access all features, and support the Pinged community.</Text>

          <View style={local.featureList}>
            {features.map((item, index) => (
              <View key={index} style={local.featureItem}>
                <Image source={item.icon} style={local.featureIcon} />
                <Text style={local.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.emailBtn} onPress={() => alert('Redirect to payment screen')}>
            <Text style={styles.btnText}>💎 Upgrade Now</Text>
          </TouchableOpacity>

          <Text style={local.legal}>
            1 free game/day included on free plan. Cancel anytime. All prices in CAD.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const local = StyleSheet.create({
  container: {
    paddingHorizontal: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24
  },
  featureList: {
    marginBottom: 30
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  featureIcon: {
    width: 26,
    height: 26,
    marginRight: 12
  },
  featureText: {
    fontSize: 15,
    color: '#333'
  },
  legal: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20
  }
});

export default PremiumScreen;