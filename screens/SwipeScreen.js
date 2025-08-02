import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
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
import { Easing } from 'react-native';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING } from '../layout';
import { useNotification } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';
import BoostModal from '../components/BoostModal';
import { useChats } from '../contexts/ChatContext';
import firebase from '../firebase';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { imageSource } from '../utils/avatar';
import Loader from '../components/Loader';
import { computePriority } from '../utils/priority';
import { handleLike } from '../utils/matchUtils';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import FullProfileModal from '../components/FullProfileModal';
import useVoicePlayback from '../hooks/useVoicePlayback';
import { useSound } from '../contexts/SoundContext';
import { useFilters } from '../contexts/FilterContext';
import { useLikeLimit } from '../contexts/LikeLimitContext';
import { useLikeLimit } from '../contexts/LikeLimitContext';
import { FONT_FAMILY } from '../textStyles';
import UserCard from '../components/UserCard';
import SwipeControls from '../components/SwipeControls';
import FilterPanel from '../components/FilterPanel';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = SCREEN_HEIGHT;
const PAGE_SIZE = 20;
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

const likeRetryQueue = [];

async function processLikeQueue() {
  const state = await Network.getNetworkStateAsync();
  if (!state.isConnected) return;
  while (likeRetryQueue.length) {
    const task = likeRetryQueue[0];
    try {
      await task();
      likeRetryQueue.shift();
    } catch (e) {
      break;
    }
  }
}


const SwipeScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const { user: currentUser, updateUser, blocked } = useUser();
  const { play } = useSound();
  const { addMatch } = useChats();
  const isPremiumUser = !!currentUser?.isPremium;
  const { likesLeft, recordLikeSent } = useLikeLimit();
  const {
    location: filterLocation,
    ageRange,
    interests,
    gender: filterGender,
    verifiedOnly,
  } = useFilters();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [matchLine, setMatchLine] = useState('');
  const [matchGame, setMatchGame] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchUsersRef = useRef(null);

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
  }, []);

  useEffect(() => {
    let subscription;
    Network.addNetworkStateListenerAsync((state) => {
      if (state.isConnected) {
        processLikeQueue();
      }
    }).then((s) => (subscription = s));
    processLikeQueue();
    return () => {
      subscription && subscription.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async (loadMore = false) => {
      if (!currentUser?.uid) {
        if (mounted) setLoadingUsers(false);
        return;
      }
      if (mounted) {
        if (loadMore) setLoadingMore(true);
        else setLoadingUsers(true);
      }
      if (!loadMore) {
        setLastDoc(null);
        setHasMore(true);
      }
      try {
        let userQuery = firebase.firestore().collection('users');
        const blockedIds = Array.isArray(blocked) ? blocked : [];

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

        userQuery = userQuery.orderBy('priorityScore', 'desc');
        if (loadMore && lastDoc) {
          userQuery = userQuery.startAfter(lastDoc);
        }

        const snap = await userQuery.limit(PAGE_SIZE).get();
        let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const debug = { queryCount: data.length };

        data = data.filter(
          (u) => u.uid !== currentUser.uid && !blockedIds.includes(u.uid || u.id),
        );
        debug.afterSelfFilter = data.length;


        let formatted = data.map((u) => {
          return {
            id: u.uid || u.id,
            displayName: u.displayName || 'User',
            age: u.age || '',
            gender: u.gender || '',
            photoURL: u.photoURL || '',
            city: u.city || u.location || '',
            isVerified: !!u.isVerified,
            images: [imageSource(u.photoURL, require('../assets/user1.jpg'))],
          };
        });




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

        if (mounted) {
          if (!loadMore) setCurrentIndex(0);
          setUsers((prev) => (loadMore ? [...prev, ...formatted] : formatted));
          setLastDoc(snap.docs[snap.docs.length - 1] || null);
          setHasMore(snap.docs.length === PAGE_SIZE);
          setDebugInfo(debug);
        }
      } catch (e) {
        console.error('Failed to load users', e);
      }
      if (mounted) {
        if (loadMore) setLoadingMore(false);
        else setLoadingUsers(false);
      }
    };
    fetchUsersRef.current = fetchUsers;
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, [
    currentUser?.uid,
    filterLocation,
    ageRange,
    interests,
    filterGender,
    verifiedOnly,
    blocked,
  ]);

  // Reset card position whenever the index changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [currentIndex]);


  const handleSwipe = async (direction) => {
    if (!displayUser || actionLoading) return;
    const targetUser = displayUser;
    setActionLoading(true);

    // Provide light haptic feedback on every swipe
    Haptics.selectionAsync().catch(() => {});
    play(direction === 'left' ? 'swipe_left' : 'swipe_right');

    const prevIndex = currentIndex;
    const prevHistory = history;

    const applyOptimistic = () => {
      setHistory((h) => [...h, currentIndex]);
      pan.setValue({ x: 0, y: 0 });
      setImageIndex(0);
      setCurrentIndex((i) => i + 1);
    };

    if (direction === 'right') {
      if (likesLeft <= 0 && !isPremiumUser) {
        navigation.navigate('PremiumPaywall', { context: 'paywall' });
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        setActionLoading(false);
        return;
      }

      applyOptimistic();

      try {
        const likeOp = async () => {
          const { success } = await handleLike({
            currentUser,
            targetUser,
            firestore: firebase.firestore(),
            navigation,
            isPremiumUser,
            showNotification,
            addMatch,
            setMatchedUser,
            setMatchLine,
            setMatchGame,
            play,
            setShowFireworks,
          });
          if (!success) {
            throw new Error('Like failed');
          }
          recordLikeSent();
        };
        await likeOp();
        await processLikeQueue();
      } catch (e) {
        const state = await Network.getNetworkStateAsync();
        if (!state.isConnected) {
          likeRetryQueue.push(async () => {
            const { success } = await handleLike({
              currentUser,
              targetUser,
              firestore: firebase.firestore(),
              navigation,
              isPremiumUser,
              showNotification,
              addMatch,
              setMatchedUser,
              setMatchLine,
              setMatchGame,
              play,
              setShowFireworks,
            });
            if (success) recordLikeSent();
          });
          Toast.show({
            type: 'info',
            text1: 'Offline. Like queued.',
          });
        } else {
          console.warn('Failed to like user', e);
          Toast.show({ type: 'error', text1: 'Failed to like user' });
          setHistory(prevHistory);
          setCurrentIndex(prevIndex);
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
        setActionLoading(false);
        return;
      }
      setActionLoading(false);
      return;
    } else if (direction !== 'left') {
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      setActionLoading(false);
      return;
    }

    applyOptimistic();
    setActionLoading(false);
  };

  const rewind = () => {
    if (!isPremiumUser) {
      navigation.navigate('PremiumPaywall', { context: 'paywall' });
      return;
    }
    if (history.length === 0) return;
    const prevIndex = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentIndex(prevIndex);
    setImageIndex(0);
    pan.setValue({ x: 0, y: 0 });
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

  const loadMoreUsers = () => {
    if (loadingMore || !hasMore) return;
    fetchUsersRef.current?.(true);
  };


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        const isTap = Math.abs(gesture.dx) < 10 && Math.abs(gesture.dy) < 10;
        if (isTap) {
          setImageIndex((i) =>
            (i + 1) % (displayUser?.images?.length || 1)
          );
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          return;
        }

        if (gesture.dx > 120) {
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
    if (currentUser?.boostTrialUsed && !isPremiumUser) {
      navigation.navigate('PremiumPaywall', { context: 'upgrade' });
    } else {
      setShowBoostModal(true);
    }
  };

  const gradientColors = theme.gradient;

  const controlButtons = [
    { icon: 'flame', color: '#fb923c', action: handleBoostPress },
    {
      icon: 'close',
      color: '#f87171',
      action: swipeLeft,
      longAction: () =>
        isPremiumUser
          ? rewind()
          : navigation.navigate('PremiumPaywall', { context: 'paywall' }),
    },
    {
      icon: 'heart',
      color: '#ff75b5',
      action: swipeRight,
    },
  ];


  return (
    <GradientBackground colors={gradientColors} style={{ flex: 1 }}>
      <ScreenContainer style={styles.container}>
        <Header />
        <UserCard
          user={displayUser}
          panHandlers={panResponder.panHandlers}
          pan={pan}
          likeOpacity={likeOpacity}
          nopeOpacity={nopeOpacity}
          superLikeOpacity={superLikeOpacity}
          imageIndex={imageIndex}
          onImagePress={() =>
            setImageIndex((i) => (i + 1) % (displayUser?.images?.length || 1))
          }
          onShowDetails={() => {
            Haptics.selectionAsync().catch(() => {});
            setShowDetails(true);
          }}
          onShowProfile={() => {
            Haptics.selectionAsync().catch(() => {});
            setShowProfile(true);
          }}
          isBoosted={isDisplayBoosted}
        />
        <FilterPanel
          loading={loadingUsers}
          onBoostPress={handleBoostPress}
          onChangeFilters={() => {
            Haptics.selectionAsync().catch(() => {});
            navigation.navigate('Settings');
          }}
          show={!displayUser}
        />
        {!displayUser && hasMore ? (
          <TouchableOpacity
            onPress={loadMoreUsers}
            style={styles.loadMoreButton}
            disabled={loadingMore}
          >
            <Text style={styles.loadMoreText}>
              {loadingMore ? 'Loading...' : 'Load more'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <SwipeControls
          buttons={controlButtons}
          scaleRefs={scaleRefs}
          actionLoading={actionLoading}
        />
        {actionLoading && (
          <View style={styles.actionLoader} pointerEvents="none">
            <Loader size="small" />
          </View>
        )}

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
        <FullProfileModal
          visible={showProfile}
          onClose={() => setShowProfile(false)}
          user={displayUser}
        />
        <BoostModal
          visible={showBoostModal}
          trialUsed={!!currentUser?.boostTrialUsed}
          onActivate={activateBoost}
          onUpgrade={() => navigation.navigate('PremiumPaywall', { context: 'upgrade' })}
          onClose={() => setShowBoostModal(false)}
        />
        {debugInfo ? (
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
  nameText: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.heading,
    color: '#fff',
  },
  actionLoader: {
    position: 'absolute',
    bottom: BUTTON_ROW_BOTTOM + 70,
    left: 0,
    right: 0,
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
  loadMoreButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  loadMoreText: { color: theme.accent, fontSize: 16 },
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

export default SwipeScreen;
