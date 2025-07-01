import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
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
import { useGameLimit } from '../contexts/GameLimitContext';
import { useChats } from '../contexts/ChatContext';
import SkeletonPlaceholder from '../components/SkeletonPlaceholder';
import { allGames } from '../data/games';
import { games as gameRegistry } from '../games';
import PropTypes from 'prop-types';
import { getRandomBot } from '../ai/bots';
import ProgressBar from '../components/ProgressBar';
import Card from '../components/Card';
import { SAMPLE_EVENTS, SAMPLE_POSTS } from '../data/community';
import { eventImageSource } from '../utils/avatar';

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
  const { user, loginBonus } = useUser();
  const { matches, loading: matchesLoading } = useChats();
  const isPremiumUser = !!user?.isPremium;
  const { gamesLeft } = useGameLimit();
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playTarget, setPlayTarget] = useState('match');
  const [showBonus, setShowBonus] = useState(false);
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
        <ScrollView contentContainerStyle={[local.container, { paddingBottom: 100 }]}>
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

          <View style={local.group}>
            <Text style={local.sectionTitle}>Matches</Text>
            {matchesLoading && matches.length === 0 ? (
              <FlatList
                data={[1, 2, 3, 4]}
                keyExtractor={(item) => item.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={local.carousel}
                renderItem={() => (
                  <Card style={[local.matchTile, { backgroundColor: theme.card }]}>
                    <SkeletonPlaceholder
                      shapes={[
                        { circle: true, size: 60, style: { alignSelf: 'center', marginBottom: 6 } },
                        { width: 80, height: 16, borderRadius: 8, style: { alignSelf: 'center' } },
                      ]}
                    />
                  </Card>
                )}
              />
            ) : (
              <FlatList
                data={matches}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={local.carousel}
                renderItem={({ item }) => (
                  <Card
                    onPress={() => navigation.navigate('Chat', { user: item })}
                    style={[local.matchTile, { backgroundColor: theme.card }]}
                  >
                    <Image source={item.image} style={local.matchAvatar} />
                    <Text style={[local.matchName, { color: theme.text }]}>{item.displayName}</Text>
                  </Card>
                )}
              />
            )}
          </View>

          <View style={local.group}>
            <Card
              onPress={() => navigation.navigate('Play')}
              style={[local.fullTile, { backgroundColor: theme.card }]}
            >
              <Text style={[local.tileEmoji, { marginBottom: 0 }]}>🎮</Text>
              <Text style={[local.fullTileText, { color: theme.text }]}>Games</Text>
            </Card>
          </View>

          <View style={local.group}>
            <Text style={local.sectionTitle}>Community Board</Text>
            <FlatList
              data={SAMPLE_EVENTS}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={local.carousel}
              renderItem={({ item }) => (
                <Card style={[local.eventCard, { backgroundColor: theme.card }]}>
                  <Image source={eventImageSource(item.image)} style={local.eventImage} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[local.eventTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={local.eventTime}>{item.time}</Text>
                  </View>
                </Card>
              )}
            />
          </View>
          {SAMPLE_POSTS.map((post) => (
            <Card
              key={`p-${post.id}`}
              style={[local.postCardPreview, { backgroundColor: theme.card }]}
            >
              <Text style={[local.postTitle, { color: theme.text }]}>{post.title}</Text>
              <Text style={local.postTime}>{post.time}</Text>
              <Text style={[local.postDesc, { color: theme.textSecondary }]}>{post.description}</Text>
            </Card>
          ))}
        </ScrollView>

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
      alignItems: 'center',
      paddingHorizontal: 20,
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
      alignItems: 'center',
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
      paddingHorizontal: 20,
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
    matchTile: {
      width: CARD_SIZE,
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      padding: 12,
    },
    matchAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 6,
    },
    matchName: {
      fontSize: 13,
      fontWeight: '600',
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
      flexDirection: "row",
      borderRadius: 12,
      padding: 12,
      width: CARD_SIZE + 40,
      marginRight: 12,
      alignItems: "center",
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
  });

export default HomeScreen;
