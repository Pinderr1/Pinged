// /screens/StatsScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { avatarSource } from '../utils/avatar';

const StatsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { user } = useUser();
  const isPremium = !!user?.isPremium;

  const stats = {
    gamesPlayed: 87,
    gamesWon: 52,
    favoriteGame: user?.favoriteGame || 'Chess',
    matches: 120,
    swipes: 421,
    messagesSent: 198,
    xp: user?.xp || 0,
    streak: user?.streak || 0,
    badge: 'Top 5% Swipers',
  };

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={{ flex: 1 }}
    >
      <Header showLogoOnly />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Summary */}
        <View style={styles.profileCard}>
          <Image source={avatarSource(user?.photoURL)} style={styles.avatar} />
          <Text style={styles.name}>{user?.displayName || 'User'}</Text>
          {isPremium && <Text style={styles.premiumBadge}>★ Premium</Text>}
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
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>XP</Text>
          <Text style={styles.statValue}>{stats.xp}</Text>
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

        {!isPremium && (
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

const getStyles = (theme) => StyleSheet.create({
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
    fontWeight: 'bold',
    color: theme.text
  },
  premiumBadge: {
    marginTop: 6,
    color: '#fff',
    backgroundColor: theme.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    color: theme.text
  },
  statBox: {
    backgroundColor: theme.card,
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
    color: theme.textSecondary
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text
  },
  premiumButton: {
    marginTop: 20,
    backgroundColor: theme.accent,
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
