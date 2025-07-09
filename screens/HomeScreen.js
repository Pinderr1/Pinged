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
import { useGameLimit } from '../contexts/GameLimitContext';
import { HEADER_SPACING, SPACING } from '../layout';

import { allGames } from '../data/games';
import { games as gameRegistry } from '../games';
import PropTypes from 'prop-types';
import { getRandomBot } from '../ai/bots';
import ProgressBar from '../components/ProgressBar';
import { getNextUnlock } from '../utils/unlocks';
import Card from '../components/Card';
import GradientButton from '../components/GradientButton';
import PremiumBanner from '../components/PremiumBanner';
import ActiveGamesPreview from '../components/ActiveGamesPreview';
import MatchesPreview from '../components/MatchesPreview';
import { FONT_FAMILY } from '../textStyles';
import useFreeGame from '../hooks/useFreeGame';
import { useChats } from '../contexts/ChatContext';
import firebase from '../firebase';
import Toast from 'react-native-toast-message';

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
  const isPremiumUser = !!user?.isPremium;
  const { gamesLeft } = useGameLimit();
  const { freeGamesToday, recordFreeGame } = useFreeGame();
  const { addMatch } = useChats();
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playTarget, setPlayTarget] = useState('match');
  const [showBonus, setShowBonus] = useState(false);
  const [showPremiumBanner, setShowPremiumBanner] = useState(!isPremiumUser);
  const local = getStyles(theme);


  const quickPlayOptions = [
    { key: 'match', title: 'Invite Match', emoji: '👥' },
    { key: 'ai', title: 'Play AI', emoji: '🤖' },
    { key: 'stranger', title: 'Play With Stranger', emoji: '🎲' },
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

  const createChat = async (users) => {
    const ref = await firebase
      .firestore()
      .collection('matches')
      .add({
        users,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    return ref.id;
  };

  const updateDailyUsage = async () => {
    if (!user?.uid) return;
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .set(
          {
            dailyGameUsage: {
              lastFreeGame: firebase.firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
    } catch (e) {
      console.warn('Failed to update daily usage', e);
    }
  };

  const matchWithStranger = async (gameId) => {
    try {
      if (!user?.uid) return;
      const userSnap = await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .get();
      const last =
        userSnap.data()?.dailyGameUsage?.lastFreeGame?.toDate?.() ||
        userSnap.data()?.dailyGameUsage?.lastFreeGame ||
        null;
      const today = new Date();
      if (
        !isPremiumUser &&
        last &&
        new Date(last).toDateString() === today.toDateString()
      ) {
        navigation.navigate('Premium', { context: 'paywall' });
        return;
      }

      const sessionsRef = firebase.firestore().collection('gameSessions');
      const waiting = await sessionsRef
        .where('game', '==', gameId)
        .where('player2', '==', null)
        .where('status', '==', 'waiting')
        .limit(1)
        .get();

      if (!waiting.empty) {
        const doc = waiting.docs[0];
        const data = doc.data();
        await doc.ref.update({ player2: user.uid, status: 'active' });
        await firebase
          .firestore()
          .collection('matches')
          .doc(data.chatId)
          .update({ users: firebase.firestore.FieldValue.arrayUnion(user.uid) });
        const oppSnap = await firebase
          .firestore()
          .collection('users')
          .doc(data.player1)
          .get();
        const opp = oppSnap.data() || {};
        const match = {
          id: data.chatId,
          otherUserId: data.player1,
          displayName: opp.displayName || 'Player',
          image: opp.photoURL ? { uri: opp.photoURL } : require('../assets/user1.jpg'),
          avatarOverlay: opp.avatarOverlay || '',
          online: !!opp.online,
          messages: [],
          matchedAt: new Date().toISOString(),
          activeGameId: gameId,
          pendingInvite: null,
        };
        addMatch(match);
        await updateDailyUsage();
        Toast.show({
          type: 'success',
          text1: "🎮 You're matched! Say hi & make your move…",
        });
        navigation.navigate('Chat', {
          user: match,
          gameId,
          chatId: data.chatId,
        });
      } else {
        const chatId = await createChat([user.uid]);
        const ref = await sessionsRef.add({
          game: gameId,
          player1: user.uid,
          player2: null,
          status: 'waiting',
          chatId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await updateDailyUsage();
        const unsub = ref.onSnapshot(async (snap) => {
          const d = snap.data();
          if (d.player2 && d.status === 'active') {
            unsub();
            const oppSnap2 = await firebase
              .firestore()
              .collection('users')
              .doc(d.player2)
              .get();
            const opp = oppSnap2.data() || {};
            await firebase
              .firestore()
              .collection('matches')
              .doc(chatId)
              .update({
                users: firebase.firestore.FieldValue.arrayUnion(d.player2),
              });
            const match = {
              id: chatId,
              otherUserId: d.player2,
              displayName: opp.displayName || 'Player',
              image: opp.photoURL ? { uri: opp.photoURL } : require('../assets/user1.jpg'),
              avatarOverlay: opp.avatarOverlay || '',
              online: !!opp.online,
              messages: [],
              matchedAt: new Date().toISOString(),
              activeGameId: gameId,
              pendingInvite: null,
            };
            addMatch(match);
            Toast.show({
              type: 'success',
              text1: "🎮 You're matched! Say hi & make your move…",
            });
            navigation.navigate('Chat', {
              user: match,
              gameId,
              chatId,
            });
          }
        });
      }
    } catch (e) {
      console.warn('Failed to match with stranger', e);
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
    } else if (playTarget === 'stranger') {
      matchWithStranger(game.id);
    } else {
      navigation.navigate('GameInvite', { game: { id: game.id, title: game.title } });
    }
  };


  const level = Math.floor((user?.xp || 0) / 100);
  const xpProgress = (user?.xp || 0) % 100;
  const streakProgress = Math.min((user?.streak || 0) % 7, 7);
  const nextUnlock = getNextUnlock(level);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer>
        <Header showLogoOnly />
        <ScrollView
          keyboardShouldPersistTaps="handled"
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
              {isPremiumUser && (
                <Text style={local.premiumXp}>Premium XP</Text>
              )}
              <Text style={[local.streakLabel, { color: theme.textSecondary }]}>{`${user?.streak || 0} day streak`}</Text>
              <ProgressBar value={streakProgress} max={7} color="#2ecc71" />
              {nextUnlock && (
                <Text style={[local.unlockText, { color: theme.textSecondary }]}>
                  {`Next unlock at Level ${nextUnlock.level}: ${nextUnlock.reward.name}`}
                </Text>
              )}
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
            {quickPlayOptions.slice(0, 3).map((item) => (
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

        </ScrollView>
        <View style={local.swipeButtonContainer}>
          <GradientButton
            text="Swipe Now"
            onPress={() => {
              if (!isPremiumUser && freeGamesToday >= 1) {
                navigation.navigate('Premium', { context: 'paywall' });
              } else {
                recordFreeGame();
                navigation.navigate('Swipe');
              }
            }}
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
      fontFamily: FONT_FAMILY.heading,
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
      fontFamily: FONT_FAMILY.bold,
      alignSelf: 'center',
      marginBottom: 8,
      color: theme.accent,
    },
    progressCard: {
      marginBottom: 20,
      alignSelf: 'stretch',
    },
    group: {
      marginBottom: 32,
      alignItems: 'stretch',
      width: '100%',
    },
    levelText: {
      fontSize: 16,
      fontFamily: FONT_FAMILY.bold,
      marginBottom: 4,
    },
    premiumXp: {
      fontSize: 10,
      color: '#fff',
      backgroundColor: theme.accent,
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginTop: 4,
    },
    streakLabel: {
      fontSize: 12,
      fontFamily: FONT_FAMILY.regular,
      marginTop: 8,
      marginBottom: 2,
    },
    unlockText: {
      fontSize: 12,
      marginTop: 8,
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
      fontFamily: FONT_FAMILY.bold,
      marginLeft: 12,
    },
    tileText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY.medium,
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
      fontFamily: FONT_FAMILY.bold,
    },
    eventTime: {
      fontSize: 12,
      color: theme.accent,
      marginBottom: 2,
    },
    eventDesc: {
      fontSize: 12,
      fontFamily: FONT_FAMILY.regular,
    },
    featuredEventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: SPACING.MD,
      marginBottom: SPACING.MD,
      alignSelf: 'stretch',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    featuredEventContent: {
      flex: 1,
      marginLeft: SPACING.MD,
    },
    swipeButtonContainer: {
      position: 'absolute',
      left: SPACING.XL,
      right: SPACING.XL,
      bottom: SPACING.XL,
    },
    postCardPreview: {
      borderRadius: 12,
      padding: SPACING.MD,
      alignSelf: 'stretch',
      marginBottom: SPACING.MD,
    },
    postTitle: {
      fontSize: 14,
      fontFamily: FONT_FAMILY.bold,
    },
    postTime: {
      fontSize: 12,
      color: theme.accent,
      marginBottom: 2,
    },
    postDesc: {
      fontSize: 12,
      fontFamily: FONT_FAMILY.regular,
    },
  });

export default HomeScreen;
