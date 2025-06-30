import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  Modal,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import Toast from 'react-native-toast-message';
import GradientBackground from '../components/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING } from '../layout';
import { useNotification } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { allGames } from '../data/games';
import { icebreakers } from '../data/prompts';
import { useChats } from '../contexts/ChatContext';
import { db } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { imageSource } from '../utils/avatar';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import PropTypes from 'prop-types';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;
const MAX_LIKES = 100;
const BUTTON_ROW_BOTTOM = SCREEN_HEIGHT * 0.05;

const computeMatchPercent = (a, b) => {
  if (!a || !b) return 0;
  let total = 0;
  let score = 0;

  // Shared favorite games
  if (Array.isArray(a.favoriteGames) && Array.isArray(b.favoriteGames)) {
    total += 1;
    if (a.favoriteGames.some((g) => b.favoriteGames.includes(g))) score += 1;
  }

  // User A's gender preference towards B
  if (a.genderPref && b.gender) {
    total += 1;
    if (a.genderPref === 'Any' || a.genderPref === b.gender) score += 1;
  }

  // User B's gender preference towards A
  if (b.genderPref && a.gender) {
    total += 1;
    if (b.genderPref === 'Any' || b.genderPref === a.gender) score += 1;
  }

  // Similar age (within 3 years)
  if (a.age && b.age) {
    total += 1;
    if (Math.abs(a.age - b.age) <= 3) score += 1;
  }

  if (total === 0) return 0;
  return Math.round((score / total) * 100);
};


const SwipeScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const { user: currentUser } = useUser();
  const { devMode } = useDev();
  const { addMatch } = useChats();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { sendGameInvite } = useMatchmaking();
  const isPremiumUser = !!currentUser?.isPremium;
  const requireCredits = useRequireGameCredits();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likesUsed, setLikesUsed] = useState(0);
  const [matchedUser, setMatchedUser] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [showSuperLikeAnim, setShowSuperLikeAnim] = useState(false);
  const [matchLine, setMatchLine] = useState('');
  const [matchGame, setMatchGame] = useState(null);

  const pan = useRef(new Animated.ValueXY()).current;
  const scaleRefs = useRef(Array(5).fill(null).map(() => new Animated.Value(1))).current;
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = pan.x.interpolate({
    inputRange: [-150, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const superLikeOpacity = pan.y.interpolate({
    inputRange: [-150, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const [users, setUsers] = useState([]);
  const displayUser = users[currentIndex] ?? null;

  useEffect(() => {
    setCurrentIndex(0);
    setHistory([]);
  }, [devMode]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser?.uid) return;
      try {
        let userQuery = db
          .collection('users')
          .where('uid', '!=', currentUser.uid);
        if (currentUser.location) {
          userQuery = userQuery.where('location', '==', currentUser.location);
        }
        const snap = await userQuery.limit(50).get();
        let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (devMode) {
          data = [
            {
              id: '__devUser',
              displayName: 'Dev Tester',
              age: 99,
              bio: 'Testing swipes',
              photoURL: null,
              favoriteGames: ['Chess'],
              gender: 'Other',
              genderPref: 'Any',
              location: 'Localhost',
            },
            ...data,
          ];
        }
        const formatted = data.map((u) => {
          const imgs = Array.isArray(u.photos) && u.photos.length
            ? u.photos
            : [u.photoURL];
          const images = imgs.map((img) =>
            imageSource(img, require('../assets/user1.jpg'))
          );
          return {
            id: u.uid || u.id,
            displayName: u.displayName || 'User',
            age: u.age || '',
            bio: u.bio || '',
            favoriteGames: Array.isArray(u.favoriteGames) ? u.favoriteGames : [],
            gender: u.gender || '',
            genderPref: u.genderPref || '',
            location: u.location || '',
            images,
          };
        });
        setUsers(formatted);
      } catch (e) {
        console.warn('Failed to load users', e);
      }
    };
    fetchUsers();
  }, [currentUser?.uid, devMode]);

  // Reset card position whenever the index changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [currentIndex]);

const handleSwipe = async (direction) => {
  if (!displayUser) return;

  // Provide light haptic feedback on every swipe
  Haptics.selectionAsync().catch(() => {});

    if (direction === 'right') {
      if (likesUsed >= MAX_LIKES && !isPremiumUser && !devMode) {
        navigation.navigate('Premium', { context: 'paywall' });
        return;
      }

      setLikesUsed((prev) => prev + 1);
      showNotification(`You liked ${displayUser.displayName}`);

      if (currentUser?.uid && displayUser.id && !devMode) {
        try {
          await db
            .collection('likes')
            .doc(currentUser.uid)
            .collection('liked')
            .doc(displayUser.id)
            .set({ createdAt: serverTimestamp() });

          const reciprocal = await db
            .collection('likes')
            .doc(displayUser.id)
            .collection('liked')
            .doc(currentUser.uid)
            .get();

          if (reciprocal.exists) {
            const matchRef = await db
              .collection('matches')
              .add({
                users: [currentUser.uid, displayUser.id],
                createdAt: serverTimestamp(),
              });

            addMatch({
              id: matchRef.id,
              displayName: displayUser.displayName,
              age: displayUser.age,
              image: displayUser.images[0],
              messages: [],
              matchedAt: 'now',
              activeGameId: null,
              pendingInvite: null,
            });

            setMatchedUser(displayUser);
            setMatchLine(
              icebreakers[Math.floor(Math.random() * icebreakers.length)] || ''
            );
            setMatchGame(
              allGames[Math.floor(Math.random() * allGames.length)] || null
            );
            // Provide a stronger haptic pulse when a match occurs
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            ).catch(() => {});
            // Placeholder: play short match sound here
            Toast.show({ type: 'success', text1: "It's a match!" });
            setShowFireworks(true);
            setTimeout(() => setShowFireworks(false), 2000);
          }
        } catch (e) {
          console.warn('Failed to process like', e);
        }
      } else if (devMode) {
        // In dev mode instantly match
        addMatch({
          id: displayUser.id,
          displayName: displayUser.displayName,
          age: displayUser.age,
          image: displayUser.images[0],
          messages: [],
          matchedAt: 'now',
          activeGameId: null,
          pendingInvite: null,
        });
        setMatchedUser(displayUser);
        setMatchLine(
          icebreakers[Math.floor(Math.random() * icebreakers.length)] || ''
        );
        setMatchGame(allGames[Math.floor(Math.random() * allGames.length)] || null);
        // Provide a stronger haptic pulse when a match occurs
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
        // Placeholder: play short match sound here
        Toast.show({ type: 'success', text1: "It's a match!" });
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 2000);
      }
    }

    setHistory((h) => [...h, currentIndex]);
    pan.setValue({ x: 0, y: 0 });
    setImageIndex(0);
    setCurrentIndex((i) => i + 1);
  };

  const rewind = () => {
    if (!isPremiumUser && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    if (history.length === 0) return;
    const prevIndex = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentIndex(prevIndex);
    setImageIndex(0);
    pan.setValue({ x: 0, y: 0 });
  };

  const handleSuperLike = () => {
    if (!isPremiumUser && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    setShowSuperLikeAnim(true);
    handleSwipe('right');
    ToastAndroid.show('🌟 Superliked!', ToastAndroid.SHORT);
    setTimeout(() => setShowSuperLikeAnim(false), 1500);
  };

  const swipeLeft = () => {
    if (!displayUser) return;
    Animated.timing(pan, {
      toValue: { x: -SCREEN_WIDTH, y: 0 },
      duration: 200,
      useNativeDriver: false,
    }).start(() => handleSwipe('left'));
  };

  const swipeRight = () => {
    if (!displayUser) return;
    Animated.timing(pan, {
      toValue: { x: SCREEN_WIDTH, y: 0 },
      duration: 200,
      useNativeDriver: false,
    }).start(() => handleSwipe('right'));
  };


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => handleSwipe('right'));
        } else if (gesture.dx < -120) {
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => handleSwipe('left'));
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleGameInvite = async () => {
    if (!displayUser) return;
    if (!requireCredits()) return;
    try {
      const inviteId = await sendGameInvite(displayUser.id, '1');
      Toast.show({ type: 'success', text1: 'Invite sent!' });
      recordGamePlayed();

      const gameTitle = allGames.find((g) => g.id === '1')?.title || 'Game';
      const toLobby = () =>
        navigation.replace('GameSession', {
          game: { id: '1', title: gameTitle },
          opponent: {
            id: displayUser.id,
            displayName: displayUser.displayName,
            photo: displayUser.images[0],
          },
          inviteId,
          status: devMode ? 'ready' : 'waiting',
        });

      if (devMode) {
        toLobby();
      } else {
        setTimeout(toLobby, 2000);
      }
    } catch (e) {
      console.warn('Failed to send game invite', e);
      Toast.show({ type: 'error', text1: 'Failed to send invite' });
    }
  };

  const gradientColors = [theme.gradientStart, theme.gradientEnd];

  const matchPercent = displayUser
    ? computeMatchPercent(currentUser, displayUser)
    : 0;

  return (
    <GradientBackground colors={gradientColors} style={{ flex: 1 }}>
      <Header />
      <View style={styles.container}>
        {displayUser ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  {
                    rotate: pan.x.interpolate({
                      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                      outputRange: ['-15deg', '0deg', '15deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() =>
                setImageIndex((i) => (i + 1) % displayUser.images.length)
              }
              style={{ flex: 1 }}
            >
            <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
              <Text style={[styles.badgeText, styles.likeText]}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
              <Text style={[styles.badgeText, styles.nopeText]}>NOPE</Text>
            </Animated.View>
            <Animated.View style={[styles.badge, styles.superLikeBadge, { opacity: superLikeOpacity }]}>
              <Text style={[styles.badgeText, styles.superLikeText]}>SUPER{"\n"}LIKE</Text>
            </Animated.View>
            <Image source={displayUser.images[imageIndex]} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.imageOverlay}
            />
            <View style={styles.info}>
              <Text style={styles.name}>
                {displayUser.displayName}, {displayUser.age}
              </Text>
              <Text style={styles.match}>Match: {matchPercent}%</Text>
              <Text style={styles.bio}>{displayUser.bio}</Text>
            </View>
          </TouchableOpacity>
          </Animated.View>
        ) : null}
        {showSuperLikeAnim ? (
          <View style={styles.superLikeOverlay} pointerEvents="none">
            <LottieView
              source={require('../assets/hearts.json')}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />
          </View>
        ) : null}
        {!displayUser && (
          <Text style={styles.noMoreText}>No more swipes</Text>
        )}

        <View style={styles.buttonRow}>
          {[
            { icon: 'refresh', color: '#facc15', action: rewind },
            { icon: 'close', color: '#f87171', action: swipeLeft },
            { icon: 'star', color: '#60a5fa', action: handleSuperLike },
            { icon: 'game-controller', color: '#a78bfa', action: handleGameInvite },
            { icon: 'heart', color: '#ff75b5', action: swipeRight },
          ].map((btn, i) => (
            <Animated.View key={i} style={{ transform: [{ scale: scaleRefs[i] }] }}>
              <TouchableOpacity
                onPressIn={() =>
                  Animated.spring(scaleRefs[i], {
                    toValue: 0.9,
                    useNativeDriver: true,
                  }).start()
                }
                onPressOut={() =>
                  Animated.spring(scaleRefs[i], {
                    toValue: 1,
                    friction: 3,
                    useNativeDriver: true,
                  }).start()
                }
                onPress={btn.action}
                style={[styles.circleButton, { backgroundColor: btn.color }]}
              >
                {btn.icon === 'game-controller' ? (
                  <MaterialCommunityIcons name="gamepad-variant" size={28} color="#fff" />
                ) : (
                  <Ionicons name={btn.icon} size={28} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {matchedUser && (
          <Modal visible={showFireworks} transparent animationType="fade">
            <View style={styles.fireworksOverlay}>
              <LottieView
                source={require('../assets/confetti.json')}
                autoPlay
                loop={false}
                style={{ width: 300, height: 300 }}
              />
              <Text style={styles.matchText}>It's a Match with {matchedUser.displayName}!</Text>
              {matchLine ? (
                <Text style={styles.suggestText}>{`Try: "${matchLine}"`}</Text>
              ) : null}
              {matchGame ? (
                <Text style={styles.suggestText}>{`Or invite them to play ${matchGame.title}`}</Text>
              ) : null}
            </View>
          </Modal>
        )}
      </View>
    </GradientBackground>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: HEADER_SPACING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: '100%',
    height: '75%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
  },
  info: {
    padding: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  match: {
    fontSize: 18,
    marginTop: 4,
    fontWeight: 'bold',
    color: theme.accent,
  },
  bio: {
    fontSize: 16,
    marginTop: 6,
    color: '#666',
  },
  extra: {
    fontSize: 14,
    marginTop: 4,
    color: '#555',
  },
  noMoreText: {
    fontSize: 20,
    color: '#999',
    textAlign: 'center',
    marginTop: 60,
  },
  buttonRow: {
    position: 'absolute',
    bottom: BUTTON_ROW_BOTTOM,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 40,
    padding: 10,
    borderWidth: 4,
    borderRadius: 8,
  },
  likeBadge: {
    left: 20,
    borderColor: '#4ade80',
    transform: [{ rotate: '-30deg' }],
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  nopeBadge: {
    right: 20,
    borderColor: '#f87171',
    transform: [{ rotate: '30deg' }],
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
  },
  badgeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  likeText: {
    color: '#4ade80',
  },
  nopeText: {
    color: '#f87171',
  },
  superLikeBadge: {
    top: CARD_HEIGHT / 2 - 20,
    left: SCREEN_WIDTH / 2 - 80,
    borderColor: '#60a5fa',
    transform: [{ rotate: '0deg' }],
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  superLikeText: {
    color: '#60a5fa',
  },
  superLikeOverlay: {
    position: 'absolute',
    top: CARD_HEIGHT / 2 - 100,
    left: SCREEN_WIDTH / 2 - 100,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireworksOverlay: {
    flex: 1,
    backgroundColor: '#0009',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  suggestText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

SwipeScreen.propTypes = {};

export default SwipeScreen;
