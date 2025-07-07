import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import StreakRewardModal from '../components/StreakRewardModal';
import { useGameLimit } from '../contexts/GameLimitContext';
import { HEADER_SPACING } from '../layout';

import { allGames } from '../data/games';
import { games as gameRegistry } from '../games';
import PropTypes from 'prop-types';
import { getRandomBot } from '../ai/bots';
import ProgressBar from '../components/ProgressBar';
import Card from '../components/Card';
import EventFlyer from "../components/EventFlyer";
import GradientButton from '../components/GradientButton';
import { SAMPLE_EVENTS, SAMPLE_POSTS } from '../data/community';
import { eventImageSource } from '../utils/avatar';
import PremiumBanner from '../components/PremiumBanner';
import ActiveGamesPreview from '../components/ActiveGamesPreview';
import MatchesPreview from '../components/MatchesPreview';

// Map app game IDs to boardgame registry keys for AI play
const aiGameMap = allGames.reduce((acc, g) => {
  const key = Object.keys(gameRegistry).find(
    (k) => gameRegistry[k].meta.title === g.title
  );
  if (key) acc[g.id] = key;
  return acc;
}, {});

const CARD_SIZE = 140;
const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, loginBonus, streakReward, dismissStreakReward } = useUser();
  const isPremiumUser = !!user?.isPremium;
  const { gamesLeft } = useGameLimit();
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playTarget, setPlayTarget] = useState('match');
  const [showBonus, setShowBonus] = useState(false);
  const [showPremiumBanner, setShowPremiumBanner] = useState(!isPremiumUser);
  const local = getStyles(theme);


  const quickPlayOptions = [
    { key: 'match', title: 'Invite Match', emoji: '👥' },
    { key: 'ai', title: 'Play AI', emoji: '🤖' },
    { key: 'browse', title: 'Browse Games', emoji: '🕹️' },
  ];

  useEffect(() => {
    if (loginBonus) {
      setShowBonus(true);
      const t = setTimeout(() => setShowBonus(false), 4000);
      return () => clearTimeout(t);
    }
  }, [loginBonus]);

  useEffect(() => {
    setShowPremiumBanner(!isPremiumUser);
  }, [isPremiumUser]);

  const openGamePicker = (target) => {
    if (target === 'browse') {
      navigation.navigate('Play');
      return;
    }
    if (target === 'ai' || gamesLeft > 0 || isPremiumUser) {
      setPlayTarget(target);
      setGamePickerVisible(true);
    } else {
      navigation.navigate('Premium', { context: 'paywall' });
    }
  };

  const selectGame = (game) => {
    const isLocked = !isPremiumUser && game.premium;
    if (isLocked) {
      setGamePickerVisible(false);
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    setGamePickerVisible(false);
    // Record the game once the session begins in GameSessionScreen
    if (playTarget === 'ai') {
      const bot = getRandomBot();
      const aiKeyMap = { rockPaperScissors: 'rps' };
      const key = aiGameMap[game.id];
      if (!key) console.warn('No AI mapping for game id', game.id);
      const gameKey = key ? aiKeyMap[key] || key : 'ticTacToe';
      navigation.navigate('GameWithBot', {
        botId: bot.id,
        game: gameKey,
      });
    } else {
      navigation.navigate('GameInvite', { game: { id: game.id, title: game.title } });
    }
  };


  const level = Math.floor((user?.xp || 0) / 100);
  const xpProgress = (user?.xp || 0) % 100;
  const streakProgress = Math.min((user?.streak || 0) % 7, 7);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer>
        <Header showLogoOnly />
        <ScrollView
          contentContainerStyle={[
            local.container,
            { paddingTop: HEADER_SPACING, paddingBottom: 100 },
          ]}
        >
          <Text style={[local.welcome, { color: theme.text }]}>
            {`Welcome${user?.displayName ? `, ${user.displayName}` : ''}!`}
          </Text>
          {showBonus && (
            <Text style={local.bonus}>🔥 Daily Bonus +5 XP</Text>
          )}
          <View style={local.group}>
            <Card style={[local.progressCard, { backgroundColor: theme.card }]}>
              <Text style={[local.levelText, { color: theme.text }]}>{`Level ${level}`}</Text>
              <ProgressBar value={xpProgress} max={100} color={theme.accent} />
              <Text style={[local.streakLabel, { color: theme.textSecondary }]}>{`${user?.streak || 0} day streak`}</Text>
          <ProgressBar value={streakProgress} max={7} color="#2ecc71" />
        </Card>
      </View>

      {!isPremiumUser && showPremiumBanner && (
        <PremiumBanner
          onClose={() => setShowPremiumBanner(false)}
          onPress={() => navigation.navigate('Premium', { context: 'paywall' })}
        />
      )}

          <View style={local.group}>
            <Text style={local.sectionTitle}>Quick Play</Text>
            {quickPlayOptions.slice(0, 2).map((item) => (
              <Card
                key={item.key}
                onPress={() => openGamePicker(item.key)}
                style={[local.fullTile, { backgroundColor: theme.card }]}
              >
                <Text style={[local.tileEmoji, { marginBottom: 0 }]}>{item.emoji}</Text>
                <Text style={[local.fullTileText, { color: theme.text }]}>{item.title}</Text>
              </Card>
          ))}
        </View>
        <ActiveGamesPreview navigation={navigation} />
        <MatchesPreview navigation={navigation} />

        <View style={local.group}>
          <Card
            onPress={() => navigation.navigate('Play')}
            style={[local.fullTile, { backgroundColor: theme.card }]}
          >
              <Text style={[local.tileEmoji, { marginBottom: 0 }]}>🎮</Text>
              <Text style={[local.fullTileText, { color: theme.text }]}>Games</Text>
            </Card>
          </View>

          <View style={local.communityBoard}>
            <Text style={local.sectionTitle}>Community Board</Text>
            <View style={local.boardBackground}>
              {SAMPLE_EVENTS.slice(0, 3).map((ev, idx) => (
                <View key={ev.id} style={local.noteWrapper}>
                  <View style={local.pin} />
                  <EventFlyer
                    event={ev}
                    onJoin={() => navigation.navigate('Community')}
                    style={[
                      local.noteCard,
                      idx % 2 === 0 ? local.rotateLeft : local.rotateRight,
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={local.swipeButtonContainer}>
          <GradientButton
            text="Swipe Now"
            onPress={() => navigation.navigate('Swipe')}
          />
        </View>

        <Modal visible={gamePickerVisible} transparent animationType="fade">
          <View style={local.modalBackdrop}>
            <View style={local.modalCard}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Choose a Game</Text>
              {allGames.slice(0, 6).map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={local.gameOption}
                  onPress={() => selectGame(game)}
                >
                  <Text style={{ fontSize: 15 }}>{game.title}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setGamePickerVisible(false)} style={{ marginTop: 16 }}>
                <Text style={{ color: theme.accent }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <StreakRewardModal
          visible={streakReward}
          streak={user?.streak || 0}
          onClose={dismissStreakReward}
        />
      </ScreenContainer>
    </GradientBackground>
  );
};

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'stretch',
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    welcome: {
      fontSize: 18,
      fontWeight: 'bold',
      alignSelf: 'center',
      marginTop: 20,
      marginBottom: 8,
    },
    bonus: {
      fontSize: 14,
      color: '#2ecc71',
      marginBottom: 8,
      alignSelf: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      alignSelf: 'center',
      marginBottom: 8,
      color: theme.accent,
    },
    progressCard: {
      marginBottom: 16,
      alignSelf: 'stretch',
    },
    group: {
      marginBottom: 24,
      alignItems: 'stretch',
      width: '100%',
    },
    levelText: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    streakLabel: {
      fontSize: 12,
      marginTop: 8,
      marginBottom: 2,
    },
    carousel: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    tile: {
      width: CARD_SIZE,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    fullTile: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    tileEmoji: {
      fontSize: 28,
      marginBottom: 6,
    },
    fullTileText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 12,
    },
    tileText: {
      fontSize: 14,
      fontWeight: '500',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      width: '80%',
      alignItems: 'center',
    },
    gameOption: {
      paddingVertical: 10,
      width: '100%',
      alignItems: 'center',
      borderBottomColor: '#eee',
      borderBottomWidth: 1,
    },
    eventCard: {
      flexDirection: 'row',
      borderRadius: 12,
      padding: 12,
      width: '100%',
      marginRight: 12,
      alignItems: 'center',
    },
    eventImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
    },
    eventTitle: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    eventTime: {
      fontSize: 12,
      color: theme.accent,
      marginBottom: 2,
    },
    eventDesc: {
      fontSize: 12,
    },
    featuredEventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      alignSelf: 'stretch',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    featuredEventContent: {
      flex: 1,
      marginLeft: 10,
    },
    swipeButtonContainer: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 20,
    },
    postCardPreview: {
      borderRadius: 12,
      padding: 12,
      alignSelf: 'stretch',
      marginBottom: 12,
    },
    postTitle: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    postTime: {
      fontSize: 12,
      color: theme.accent,
      marginBottom: 2,
    },
    postDesc: {
      fontSize: 12,
    },
    communityBoard: {
      width: '100%',
      marginBottom: 24,
    },
    boardBackground: {
      backgroundColor: '#deb887',
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#caa76b',
    },
    noteWrapper: {
      marginBottom: 24,
      alignItems: 'center',
      width: '100%',
    },
    noteCard: {
      backgroundColor: '#fffef8',
      borderWidth: 1,
      borderColor: '#e0d4b9',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    rotateLeft: {
      transform: [{ rotate: '-2deg' }],
    },
    rotateRight: {
      transform: [{ rotate: '2deg' }],
    },
    pin: {
      position: 'absolute',
      top: -6,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#c0392b',
      borderWidth: 1,
      borderColor: '#922b21',
      zIndex: 1,
    },
  });

export default HomeScreen;
