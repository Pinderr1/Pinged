// /screens/StatsScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';

const StatsScreen = ({ navigation }) => {
  const { darkMode } = useTheme();

  const stats = {
    gamesPlayed: 87,
    gamesWon: 52,
    favoriteGame: 'Chess',
    matches: 120,
    swipes: 421,
    messagesSent: 198,
    streak: 7,
    badge: 'Top 5% Swipers',
    premium: false
  };

  return (
    <LinearGradient
      colors={darkMode ? ['#2c2c2c', '#1b1b1b'] : ['#fff', '#ffe6f0']}
      style={{ flex: 1 }}
    >
      <Header showLogoOnly />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Summary */}
        <View style={styles.profileCard}>
          <Image source={require('../assets/user1.jpg')} style={styles.avatar} />
          <Text style={styles.name}>DemoUser</Text>
          {stats.premium && <Text style={styles.premiumBadge}>★ Premium</Text>}
        </View>

        {/* Game Stats */}
        <Text style={styles.sectionTitle}>🎮 Game Stats</Text>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Games Played</Text>
          <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Games Won</Text>
          <Text style={styles.statValue}>{stats.gamesWon}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Favorite Game</Text>
          <Text style={styles.statValue}>{stats.favoriteGame}</Text>
        </View>

        {/* Social Stats */}
        <Text style={styles.sectionTitle}>💬 Social Stats</Text>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Matches</Text>
          <Text style={styles.statValue}>{stats.matches}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Swipes</Text>
          <Text style={styles.statValue}>{stats.swipes}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Messages Sent</Text>
          <Text style={styles.statValue}>{stats.messagesSent}</Text>
        </View>

        {/* Bonus + Upgrade */}
        <Text style={styles.sectionTitle}>🔥 Activity</Text>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Daily Streak</Text>
          <Text style={styles.statValue}>{stats.streak} days</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Badge</Text>
          <Text style={styles.statValue}>{stats.badge}</Text>
        </View>

        {!stats.premium && (
          <TouchableOpacity
            onPress={() => navigation.navigate('PremiumPaywall')}
            style={styles.premiumButton}
          >
            <Text style={styles.premiumText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 80,
    paddingTop: 60,
    paddingHorizontal: 20
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 20
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  premiumBadge: {
    marginTop: 6,
    color: '#fff',
    backgroundColor: '#d81b60',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
  },
  statLabel: {
    fontSize: 14,
    color: '#666'
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111'
  },
  premiumButton: {
    marginTop: 20,
    backgroundColor: '#d81b60',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  premiumText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  }
});

export default StatsScreen;