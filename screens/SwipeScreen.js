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
} from 'react-native';
import Toast from 'react-native-toast-message';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import GradientButton from '../components/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing } from 'react-native';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING, SPACING } from '../layout';
import { useNotification } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import GamePickerModal from '../components/GamePickerModal';
import BoostModal from '../components/BoostModal';
import { allGames } from '../data/games';
import { icebreakers } from '../data/prompts';
import { devUsers } from '../data/devUsers';
import { useChats } from '../contexts/ChatContext';
import firebase from '../firebase';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { imageSource } from '../utils/avatar';
import { computePriority } from '../utils/priority';
import { logDev } from '../utils/logger';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import * as Haptics from 'expo-haptics';
import SkeletonUserCard from '../components/SkeletonUserCard';
import EmptyState from '../components/EmptyState';
import useVoicePlayback from '../hooks/useVoicePlayback';
import { useSound } from '../contexts/SoundContext';
import { useFilters } from '../contexts/FilterContext';
import PropTypes from 'prop-types';
import { FONT_FAMILY } from '../textStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = SCREEN_HEIGHT;
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
  const { user: currentUser, updateUser } = useUser();
  const { play } = useSound();
  const { devMode } = useDev();
  const { addMatch } = useChats();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { sendGameInvite, cancelGameInvite } = useMatchmaking();
  const isPremiumUser = !!currentUser?.isPremium;
  const requireCredits = useRequireGameCredits();
  const {
    location: filterLocation,
    ageRange,
    interests,
    gender: filterGender,
    verifiedOnly,
  } = useFilters();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likesUsed, setLikesUsed] = useState(0);
  const [matchedUser, setMatchedUser] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [showSuperLikeAnim, setShowSuperLikeAnim] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [matchLine, setMatchLine] = useState('');
  const [matchGame, setMatchGame] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [pendingInviteId, setPendingInviteId] = useState(null);
  const [showUndoPrompt, setShowUndoPrompt] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const pan = useRef(new Animated.ValueXY()).current;
  // 4 main buttons shown in the toolbar
  const scaleRefs = useRef(
    Array(4)
      .fill(null)
      .map(() => new Animated.Value(1))
  ).current;

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
  const isDisplayBoosted =
    displayUser?.boostUntil &&
    (displayUser.boostUntil.toDate?.() || new Date(displayUser.boostUntil)) >
      new Date();
  const { playing: playingIntro, playPause: playIntro } = useVoicePlayback(
    displayUser?.introClipUrl && displayUser.introClipUrl.endsWith('.m4a')
      ? displayUser.introClipUrl
      : null
  );
  const {
    playing: playingMatchIntro,
    playPause: playMatchIntro,
  } = useVoicePlayback(
    matchedUser?.introClipUrl && matchedUser.introClipUrl.endsWith('.m4a')
      ? matchedUser.introClipUrl
      : null
  );

  useEffect(() => {
    setCurrentIndex(0);
    setHistory([]);
  }, [devMode]);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      if (!currentUser?.uid) {
        if (mounted) setLoadingUsers(false);
        return;
      }
      if (mounted) setLoadingUsers(true);
      try {
        let userQuery = firebase.firestore().collection('users');

        if (filterLocation) {
          userQuery = userQuery.where('location', '==', filterLocation);
        } else if (currentUser.location) {
          userQuery = userQuery.where('location', '==', currentUser.location);
        }

        if (Array.isArray(ageRange) && ageRange.length === 2) {
          userQuery = userQuery
            .where('age', '>=', ageRange[0])
            .where('age', '<=', ageRange[1]);
        }

        if (filterGender) {
          userQuery = userQuery.where('gender', '==', filterGender);
        }

        if (verifiedOnly) {
          userQuery = userQuery.where('isVerified', '==', true);
        }

        if (Array.isArray(interests) && interests.length) {
          userQuery = userQuery.where(
            'favoriteGames',
            'array-contains-any',
            interests.slice(0, 10)
          );
        }
        const snap = await userQuery.limit(50).get();
        let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const debug = { queryCount: data.length };

        data = data.filter((u) => u.uid !== currentUser.uid);
        debug.afterSelfFilter = data.length;

        if (devMode) {
          data = [...devUsers.slice(0, 3), ...data];
          debug.withDevUsers = data.length;
        }

        let formatted = data.map((u) => {
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
            introClipUrl: u?.introClipUrl || '',
            favoriteGames: Array.isArray(u.favoriteGames) ? u.favoriteGames : [],
            gender: u.gender || '',
            genderPref: u.genderPref || '',
            location: u.location || '',
            priorityScore: u.priorityScore || 0,
            boostUntil: u.boostUntil || null,
            isVerified: !!u.isVerified,
            images,
          };
        });

        if (filterLocation) {
          const before = formatted.length;
          formatted = formatted.filter((u) => u.location === filterLocation);
          debug.locationCount = `${before}->${formatted.length}`;
        }

        if (filterGender) {
          const before = formatted.length;
          formatted = formatted.filter((u) => u.gender === filterGender);
          debug.genderCount = `${before}->${formatted.length}`;
        }

        if (verifiedOnly) {
          const before = formatted.length;
          formatted = formatted.filter((u) => u.isVerified);
          debug.verifiedCount = `${before}->${formatted.length}`;
        }

        if (Array.isArray(ageRange) && ageRange.length === 2) {
          const before = formatted.length;
          formatted = formatted.filter(
            (u) => u.age >= ageRange[0] && u.age <= ageRange[1]
          );
          debug.ageCount = `${before}->${formatted.length}`;
        }

        if (Array.isArray(interests) && interests.length) {
          const before = formatted.length;
          formatted = formatted.filter((u) =>
            u.favoriteGames.some((g) => interests.includes(g))
          );
          debug.interestCount = `${before}->${formatted.length}`;
        }

        // Sort by priority then compatibility so premium/boosted users surface first
        formatted.sort((aUser, bUser) => {
          const prioDiff = computePriority(bUser) - computePriority(aUser);
          if (prioDiff !== 0) return prioDiff;
          return (
            computeMatchPercent(currentUser, bUser) -
            computeMatchPercent(currentUser, aUser)
          );
        });

        debug.finalCount = formatted.length;

        if (devMode && formatted.length === 0) {
          formatted = devUsers.map((u) => ({
            id: u.id,
            displayName: u.displayName,
            age: u.age,
            bio: u.bio,
            introClipUrl: u.introClipUrl,
            favoriteGames: u.favoriteGames,
            gender: u.gender,
            genderPref: u.genderPref,
            location: u.location,
            priorityScore: 0,
            boostUntil: null,
            isVerified: true,
            images: u.photos.map((img) =>
              imageSource(img, require('../assets/user1.jpg'))
            ),
          }));
          debug.devFallback = true;
        }

        if (mounted) {
          setUsers(formatted);
          setDebugInfo(debug);
        }
        logDev('Suggested users:', JSON.stringify(debug));
      } catch (e) {
        console.warn('Failed to load users', e);
      }
      if (mounted) setLoadingUsers(false);
    };
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, [
    currentUser?.uid,
    devMode,
    filterLocation,
    ageRange,
    interests,
    filterGender,
    verifiedOnly,
  ]);

  // Reset card position whenever the index changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [currentIndex]);

const handleLike = async () => {
  if (!displayUser) return;

  if (likesUsed >= MAX_LIKES && !isPremiumUser && !devMode) {
    navigation.navigate('Premium', { context: 'paywall' });
    return;
  }

  setLikesUsed((prev) => prev + 1);
  showNotification(`You liked ${displayUser.displayName}`);

  if (currentUser?.uid && displayUser.id && !devMode) {
    try {
      await firebase
        .firestore()
        .collection('likes')
        .doc(currentUser.uid)
        .collection('liked')
        .doc(displayUser.id)
        .set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });

      await firebase
        .firestore()
        .collection('likes')
        .doc(displayUser.id)
        .collection('likedBy')
        .doc(currentUser.uid)
        .set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });

      const reciprocal = await firebase
        .firestore()
        .collection('likes')
        .doc(displayUser.id)
        .collection('liked')
        .doc(currentUser.uid)
        .get();

      if (reciprocal.exists) {
        const matchRef = await firebase
          .firestore()
          .collection('matches')
          .add({
            users: [currentUser.uid, displayUser.id],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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
        play('match');
        Toast.show({ type: 'success', text1: "It's a match!" });
        showNotification("It's a match!");
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
    play('match');
    Toast.show({ type: 'success', text1: "It's a match!" });
    setShowFireworks(true);
    setTimeout(() => setShowFireworks(false), 2000);
  }
};

const handleSwipe = async (direction) => {
  if (!displayUser) return;

  // Provide light haptic feedback on every swipe
  Haptics.selectionAsync().catch(() => {});
  play(direction === 'left' ? 'swipe_left' : 'swipe_right');

  if (direction === 'right') {
    await handleLike();
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

  const handleSwipeChallenge = () => {
    if (!displayUser) return;
    if (!isPremiumUser && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    setShowGamePicker(true);
  };

  const handleSuperLike = async () => {
    if (!displayUser) return;
    if (!isPremiumUser && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }

    const targetId = displayUser.id;
    setShowSuperLikeAnim(true);
    Toast.show({ type: 'success', text1: '🌟 Superliked!' });
    handleSwipe('right');

    try {
      if (requireCredits()) {
        await sendGameInvite(targetId, '1');
        recordGamePlayed();
        Toast.show({ type: 'success', text1: 'Invite sent!' });
      }
    } catch (e) {
      console.warn('Failed to send invite', e);
    }

    setTimeout(() => setShowSuperLikeAnim(false), 1500);
  };

  const handleGamePickSelect = async (game) => {
    setShowGamePicker(false);
    if (!displayUser || !game) return;
    if (!requireCredits()) return;
    try {
      const inviteId = await sendGameInvite(displayUser.id, game.id);
      recordGamePlayed();
      setPendingInviteId(inviteId);
      setShowSuperLikeAnim(true);
      Toast.show({ type: 'success', text1: 'Invite sent!' });
      setShowUndoPrompt(true);
      setTimeout(() => setShowSuperLikeAnim(false), 1500);
      setTimeout(() => setShowUndoPrompt(false), 4000);
    } catch (e) {
      console.warn('Failed to send invite', e);
      Toast.show({ type: 'error', text1: 'Failed to send invite' });
    }
  };

  const undoInvite = async () => {
    if (!pendingInviteId) return;
    try {
      await cancelGameInvite(pendingInviteId);
      Toast.show({ type: 'success', text1: 'Invite cancelled' });
    } catch (e) {
      console.warn('Failed to cancel invite', e);
    }
    setShowUndoPrompt(false);
    setPendingInviteId(null);
  };

  const swipeLeft = () => {
    if (!displayUser) return;
    Animated.timing(pan, {
      toValue: { x: -SCREEN_WIDTH, y: 0 },
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => handleSwipe('left'));
  };

  const swipeRight = () => {
    if (!displayUser) return;
    Animated.timing(pan, {
      toValue: { x: SCREEN_WIDTH, y: 0 },
      duration: 250,
      easing: Easing.out(Easing.ease),
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
        if (gesture.dy < -120 && Math.abs(gesture.dx) < 80) {
          handleSwipeChallenge();
        } else if (gesture.dx > 120) {
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH, y: 0 },
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }).start(() => handleSwipe('right'));
        } else if (gesture.dx < -120) {
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH, y: 0 },
            duration: 250,
            easing: Easing.out(Easing.ease),
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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

  const activateBoost = async () => {
    if (!currentUser?.uid) return;
    const boostUntil = new Date(Date.now() + 30 * 60 * 1000);
    const updates = { boostUntil };
    if (!currentUser.boostTrialUsed) updates.boostTrialUsed = true;
    updateUser(updates);
    try {
      await firebase.firestore().collection('users').doc(currentUser.uid).update(updates);
      Toast.show({ type: 'success', text1: 'Boost activated!' });
    } catch (e) {
      console.warn('Failed to activate boost', e);
      Toast.show({ type: 'error', text1: 'Boost failed' });
    }
    setShowBoostModal(false);
  };

  const handleBoostPress = () => {
    if (currentUser?.boostTrialUsed && !isPremiumUser && !devMode) {
      navigation.navigate('Premium', { context: 'upgrade' });
    } else {
      setShowBoostModal(true);
    }
  };

  const gradientColors = theme.gradient;


  return (
    <GradientBackground colors={gradientColors} style={{ flex: 1 }}>
      <ScreenContainer style={styles.container}>
        <Header />
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
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageOverlay}
            />
            <View style={styles.bottomInfo}>
              <Text style={styles.distanceBadge}>
                {devMode ? '1 mile away' : 'Nearby'}
              </Text>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>
                  {displayUser.displayName}, {displayUser.age}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.accent}
                  style={{ marginLeft: 6 }}
                />
                {isDisplayBoosted && (
                  <View style={styles.boostBadge}>
                    <Text style={styles.boostBadgeText}>🔥 Boosted</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowDetails(true);
                }}
                style={styles.expandIcon}
              >
                <Ionicons name="chevron-up" size={24} color="#fff" />
              </TouchableOpacity>
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
        {!displayUser &&
          (loadingUsers ? (
            <SkeletonUserCard />
          ) : (
            <View style={styles.noMoreWrapper}>
              <EmptyState
                text="No more swipes"
                animation={require('../assets/hearts.json')}
              />
              <GradientButton
                text="Boost"
                width={180}
                onPress={handleBoostPress}
                style={{ marginTop: 20 }}
              />
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate('Settings');
                }}
                style={{ marginTop: 12 }}
              >
                <Text style={styles.changeFiltersText}>Change Filters</Text>
              </TouchableOpacity>
            </View>
          ))}

        <View style={styles.buttonRow}>
          {[
            {
              icon: 'flame',
              color: '#fb923c',
              action: handleBoostPress,
            },
            {
              icon: "close",
              color: "#f87171",
              action: swipeLeft,
              longAction: rewind,
            },
            {
              icon: "game-controller",
              color: "#a78bfa",
              action: handleGameInvite,
            },
            {
              icon: "heart",
              color: "#ff75b5",
              action: swipeRight,
              longAction: handleSuperLike,
            },
          ].map((btn, i) => (
            <Animated.View
              key={btn.icon}
              style={{ transform: [{ scale: scaleRefs[i] }] }}
            >
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
                onLongPress={() =>
                  btn.longAction && (isPremiumUser || devMode)
                    ? btn.longAction()
                    : btn.longAction && navigation.navigate('Premium', { context: 'paywall' })
                }
                delayLongPress={300}
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

        {showDetails && (
          <Modal visible={showDetails} transparent animationType="slide">
            <BlurView intensity={60} tint="dark" style={styles.detailsOverlay}>
              <View style={styles.detailsContainer}>
                <Text style={styles.nameText}>
                  {displayUser?.displayName}, {displayUser?.age}
                </Text>
                <Text style={styles.bioText}>{displayUser?.bio}</Text>
                {displayUser?.introClipUrl
                  ? displayUser.introClipUrl.endsWith('.m4a')
                    ? (
                        <TouchableOpacity
                          onPress={playIntro}
                          style={styles.playIntro}
                        >
                          <Ionicons
                            name={playingIntro ? 'pause' : 'play'}
                            size={32}
                            color={theme.accent}
                          />
                        </TouchableOpacity>
                      )
                    : (
                        <Video
                          source={{ uri: displayUser.introClipUrl }}
                          style={{ width: 200, height: 200, alignSelf: 'center', marginTop: 10 }}
                          useNativeControls
                          resizeMode="contain"
                        />
                      )
                  : null}
                <GradientButton
                  text="Close"
                  width={120}
                  onPress={() => setShowDetails(false)}
                  style={{ marginTop: 20 }}
                />
              </View>
            </BlurView>
          </Modal>
        )}

        {matchedUser && (
          <Modal visible={showFireworks} transparent animationType="fade">
            <BlurView intensity={50} tint="dark" style={styles.fireworksOverlay}>
              <LottieView
                source={require('../assets/confetti.json')}
                autoPlay
                loop={false}
                style={{ width: 300, height: 300 }}
              />
              <Text style={styles.matchText}>It's a Match with {matchedUser.displayName}!</Text>
              {matchedUser?.introClipUrl
                ? matchedUser.introClipUrl.endsWith('.m4a')
                  ? (
                      <TouchableOpacity
                        onPress={playMatchIntro}
                        style={styles.playIntro}
                      >
                        <Ionicons
                          name={playingMatchIntro ? 'pause' : 'play'}
                          size={32}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    )
                  : (
                      <Video
                        source={{ uri: matchedUser.introClipUrl }}
                        style={{ width: 200, height: 200, marginTop: 10 }}
                        useNativeControls
                        resizeMode="contain"
                      />
                    )
                : null}
              {matchLine ? (
                <Text style={styles.suggestText}>{`Try: "${matchLine}"`}</Text>
              ) : null}
              {matchGame ? (
                <Text style={styles.suggestText}>{`Or invite them to play ${matchGame.title}`}</Text>
              ) : null}
            </BlurView>
          </Modal>
        )}
        <GamePickerModal
          visible={showGamePicker}
          onSelect={handleGamePickSelect}
          onClose={() => setShowGamePicker(false)}
        />
        <BoostModal
          visible={showBoostModal}
          trialUsed={!!currentUser?.boostTrialUsed}
          onActivate={activateBoost}
          onUpgrade={() => navigation.navigate('Premium', { context: 'upgrade' })}
          onClose={() => setShowBoostModal(false)}
        />
        {showUndoPrompt && (isPremiumUser || devMode) ? (
          <View style={styles.undoBanner}>
            <Text style={styles.undoText}>Invite sent</Text>
            <TouchableOpacity onPress={undoInvite}>
              <Text style={styles.undoButton}>Undo</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {devMode && debugInfo ? (
          <View style={styles.debugOverlay}>
            <Text style={styles.debugText}>{JSON.stringify(debugInfo)}</Text>
          </View>
        ) : null}
      </ScreenContainer>
    </GradientBackground>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: BUTTON_ROW_BOTTOM + 80,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
  },
  distanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.accent,
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: SPACING.XS,
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.heading,
    color: '#fff',
  },
  expandIcon: {
    position: 'absolute',
    bottom: -30,
    alignSelf: 'center',
  },
  noMoreWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  noMoreText: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
    color: '#999',
    textAlign: 'center',
  },
  changeFiltersText: {
    color: theme.accent,
    textDecorationLine: 'underline',
    fontSize: 16,
    fontFamily: FONT_FAMILY.medium,
  },
  buttonRow: {
    position: 'absolute',
    bottom: BUTTON_ROW_BOTTOM,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: SPACING.XL,
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
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
    fontFamily: FONT_FAMILY.bold,
    color: '#fff',
  },
  likeText: {
    color: '#4ade80',
  },
  nopeText: {
    color: '#f87171',
  },
  boostBadge: {
    marginLeft: SPACING.SM,
    backgroundColor: theme.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boostBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
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
  detailsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    backgroundColor: theme.card,
    padding: SPACING.XL,
    borderRadius: 12,
    width: '80%',
  },
  bioText: {
    color: theme.text,
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
  playIntro: {
    marginTop: SPACING.MD,
    alignSelf: 'center',
  },
  fireworksOverlay: {
    flex: 1,
    backgroundColor: '#0009',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchText: {
    fontSize: 22,
    fontFamily: FONT_FAMILY.bold,
    color: '#fff',
    marginTop: SPACING.XL,
  },
  suggestText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
    color: '#fff',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  undoBanner: {
    position: 'absolute',
    bottom: BUTTON_ROW_BOTTOM + 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0009',
    paddingVertical: 6,
  },
  undoText: { color: '#fff', marginRight: 12 },
  undoButton: { color: theme.accent, fontWeight: 'bold' },
  debugOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#0009',
    padding: 8,
    borderRadius: 6,
  },
  debugText: { color: '#fff', fontSize: 12, fontFamily: FONT_FAMILY.regular },
});

SwipeScreen.propTypes = {};

export default SwipeScreen;
