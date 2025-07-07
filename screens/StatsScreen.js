// /screens/StatsScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebase from '../firebase';
import ProgressBar from '../components/ProgressBar';
import PropTypes from 'prop-types';
import { HEADER_SPACING, FONT_SIZES, BUTTON_STYLE } from '../layout';
import ProfileCard from '../components/stats/ProfileCard';
import StatBox from '../components/stats/StatBox';
import ScreenContainer from '../components/ScreenContainer';
import { CARD_STYLE } from '../components/Card';
import { getBadgeMeta } from '../utils/badges';

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
    badges: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const sessionsSnap = await firebase
          .firestore()
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

        const matchSnap = await firebase
          .firestore()
          .collection('matches')
          .where('users', 'array-contains', user.uid)
          .get();
        const matches = matchSnap.size;

        let messagesSent = 0;
        matchSnap.forEach((doc) => {
          const counts = doc.get('messageCounts') || {};
          messagesSent += counts[user.uid] || 0;
        });

        const userSnap = await firebase.firestore().collection('users').doc(user.uid).get();
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
          badges: data.badges || [],
        });
        setLoading(false);
      } catch (e) {
        console.warn('Failed to load stats', e);
        setLoading(false);
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
      <ScreenContainer scroll contentContainerStyle={styles.container}>
        {/* Profile Summary */}
        <ProfileCard
          user={user}
          isPremium={isPremium}
          badges={stats.badges}
          styles={styles}
          accent={theme.accent}
        />

        {/* Game Stats */}
        <Text style={styles.sectionTitle}>🎮 Game Stats</Text>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Games Played</Text>
          <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
        </StatBox>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Games Won</Text>
          <Text style={styles.statValue}>{stats.gamesWon}</Text>
        </StatBox>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Favorite Games</Text>
          <Text style={styles.statValue}>
            {stats.favoriteGames.length > 0 ? stats.favoriteGames.join(', ') : 'N/A'}
          </Text>
        </StatBox>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>{`XP Level ${level}`}</Text>
          <ProgressBar value={xpProgress} max={100} color={theme.accent} />
          {isPremium && (
            <Text style={styles.premiumXpBadge}>Premium XP</Text>
          )}
          <Text style={styles.statSub}>{stats.xp} XP</Text>
        </StatBox>

        {/* Social Stats */}
        <Text style={styles.sectionTitle}>💬 Social Stats</Text>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Matches</Text>
          <Text style={styles.statValue}>{stats.matches}</Text>
        </StatBox>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Swipes</Text>
          <Text style={styles.statValue}>{stats.swipes}</Text>
        </StatBox>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Messages Sent</Text>
          <Text style={styles.statValue}>{stats.messagesSent}</Text>
        </StatBox>

        {/* Bonus + Upgrade */}
        <Text style={styles.sectionTitle}>🔥 Activity</Text>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Daily Streak</Text>
          <ProgressBar value={streakProgress} max={7} color="#2ecc71" />
          <Text style={styles.statSub}>{stats.streak} days</Text>
        </StatBox>
        <StatBox loading={loading} styles={styles}>
          <Text style={styles.statLabel}>Badges</Text>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            {stats.badges.map((b) => {
              const meta = getBadgeMeta(b);
              if (!meta) return null;
              return (
                <Ionicons
                  key={b}
                  name={meta.icon}
                  size={20}
                  color={theme.accent}
                  style={{ marginHorizontal: 4 }}
                />
              );
            })}
          </View>
        </StatBox>

        {!isPremium && (
          <GradientButton
            text="Upgrade to Premium"
            onPress={() => navigation.navigate('Premium', { context: 'paywall' })}
            style={styles.premiumButton}
          />
        )}
      </ScreenContainer>
    </GradientBackground>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    paddingBottom: 80,
    paddingTop: HEADER_SPACING,
    paddingHorizontal: 0,
    alignItems: 'stretch',
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: theme.card,
    ...CARD_STYLE,
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
  premiumXpBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    color: '#fff',
    backgroundColor: theme.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: FONT_SIZES.SM - 4,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    color: theme.text,
    textAlign: 'center',
  },
  statBox: {
    backgroundColor: theme.card,
    padding: 14,
    marginBottom: 10,
    ...CARD_STYLE,
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
  skeletonLabel: {
    height: 14,
    width: '50%',
    backgroundColor: theme.textSecondary,
    opacity: 0.3,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonValue: {
    height: 18,
    width: '30%',
    backgroundColor: theme.textSecondary,
    opacity: 0.3,
    borderRadius: 4,
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
