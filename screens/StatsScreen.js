// /screens/StatsScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { avatarSource } from '../utils/avatar';
import ProgressBar from '../components/ProgressBar';
import PropTypes from 'prop-types';
import { HEADER_SPACING, FONT_SIZES, BUTTON_STYLE } from '../layout';

const StatsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { user } = useUser();
  const isPremium = !!user?.isPremium;

  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    favoriteGames: [],
    matches: 0,
    swipes: 0,
    messagesSent: 0,
    xp: 0,
    streak: 0,
    badge: '',
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.uid) return;
      try {
        const sessionsSnap = await db
          .collection('gameSessions')
          .where('players', 'array-contains', user.uid)
          .get();
        const gamesPlayed = sessionsSnap.size;
        let gamesWon = 0;
        sessionsSnap.forEach((doc) => {
          const data = doc.data();
          const idx = Array.isArray(data.players)
            ? data.players.indexOf(user.uid)
            : -1;
          if (
            idx !== -1 &&
            data.gameover &&
            data.gameover.winner === String(idx)
          ) {
            gamesWon += 1;
          }
        });

        const matchSnap = await db
          .collection('matches')
          .where('users', 'array-contains', user.uid)
          .get();
        const matches = matchSnap.size;

        let messagesSent = 0;
        matchSnap.forEach((doc) => {
          const counts = doc.get('messageCounts') || {};
          messagesSent += counts[user.uid] || 0;
        });

        const userSnap = await db.collection('users').doc(user.uid).get();
        const data = userSnap.data() || {};

        setStats({
          gamesPlayed,
          gamesWon,
          favoriteGames: data.favoriteGames || [],
          matches,
          swipes: 0,
          messagesSent,
          xp: data.xp || 0,
          streak: data.streak || 0,
          badge: '',
        });
      } catch (e) {
        console.warn('Failed to load stats', e);
      }
    };

    loadStats();
  }, [user]);

  const level = Math.floor(stats.xp / 100);
  const xpProgress = stats.xp % 100;
  const streakProgress = Math.min(stats.streak % 7, 7);

  return (
    <GradientBackground style={{ flex: 1 }}>
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
          <Text style={styles.statLabel}>Favorite Games</Text>
          <Text style={styles.statValue}>
            {stats.favoriteGames.length > 0 ? stats.favoriteGames.join(', ') : 'N/A'}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{`XP Level ${level}`}</Text>
          <ProgressBar value={xpProgress} max={100} color={theme.accent} />
          <Text style={styles.statSub}>{stats.xp} XP</Text>
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
          <ProgressBar value={streakProgress} max={7} color="#2ecc71" />
          <Text style={styles.statSub}>{stats.streak} days</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Badge</Text>
          <Text style={styles.statValue}>{stats.badge}</Text>
        </View>

        {!isPremium && (
          <GradientButton
            text="Upgrade to Premium"
            onPress={() => navigation.navigate('Premium', { context: 'paywall' })}
            style={styles.premiumButton}
          />
        )}
      </ScrollView>
    </GradientBackground>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    paddingBottom: 80,
    paddingTop: HEADER_SPACING,
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
    fontSize: FONT_SIZES.XL,
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
    fontSize: FONT_SIZES.SM - 2
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
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
    fontSize: FONT_SIZES.SM,
    color: theme.textSecondary
  },
  statValue: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: theme.text
  },
  statSub: {
    fontSize: FONT_SIZES.SM - 2,
    color: theme.textSecondary,
    marginTop: 4,
  },
  premiumButton: {
    marginTop: 20,
    backgroundColor: theme.accent,
    paddingVertical: BUTTON_STYLE.paddingVertical,
    paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
    borderRadius: BUTTON_STYLE.borderRadius,
    alignItems: 'center'
  },
  premiumText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FONT_SIZES.MD - 1
  }

});

StatsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default StatsScreen;
