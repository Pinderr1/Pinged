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
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { useChats } from '../contexts/ChatContext';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HEIGHT = 520;
const MAX_LIKES = 100;


const SwipeScreen = () => {
  const { darkMode, theme } = useTheme();
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const { user: currentUser } = useUser();
  const { devMode } = useDev();
  const { addMatch } = useChats();
  const isPremiumUser = !!currentUser?.isPremium;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likesUsed, setLikesUsed] = useState(0);
  const [matchedUser, setMatchedUser] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [boostActive, setBoostActive] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const scaleRefs = useRef(Array(6).fill(null).map(() => new Animated.Value(1))).current;
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
        const q = query(
          collection(db, 'users'),
          where('uid', '!=', currentUser.uid)
        );
        const snap = await getDocs(q);
        let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (devMode) {
          data = [
            {
              id: '__devUser',
              displayName: 'Dev Tester',
              age: 99,
              bio: 'Testing swipes',
              photoURL: null,
            },
            ...data,
          ];
        }
        const formatted = data.map((u) => ({
          id: u.uid || u.id,
          name: u.displayName || 'User',
          age: u.age || '',
          bio: u.bio || '',
          images: [u.photoURL || require('../assets/user1.jpg')],
        }));
        setUsers(formatted);
      } catch (e) {
        console.warn('Failed to load users', e);
      }
    };
    fetchUsers();
  }, [currentUser?.uid, devMode]);

  const handleSwipe = async (direction) => {
    if (!displayUser) return;

    if (direction === 'right') {
      if (likesUsed >= MAX_LIKES && !isPremiumUser && !devMode) {
        navigation.navigate('PremiumPaywall');
        return;
      }

      setLikesUsed((prev) => prev + 1);
      showNotification(`You liked ${displayUser.name}`);

      if (currentUser?.uid && displayUser.id && !devMode) {
        try {
          await setDoc(
            doc(db, 'likes', currentUser.uid, 'liked', displayUser.id),
            { createdAt: serverTimestamp() }
          );

          const reciprocal = await getDoc(
            doc(db, 'likes', displayUser.id, 'liked', currentUser.uid)
          );

          if (reciprocal.exists()) {
            const matchRef = await addDoc(collection(db, 'matches'), {
              users: [currentUser.uid, displayUser.id],
              createdAt: serverTimestamp(),
            });

            addMatch({
              id: matchRef.id,
              name: displayUser.name,
              age: displayUser.age,
              image: displayUser.images[0],
              messages: [],
              matchedAt: 'now',
              activeGameId: null,
              pendingInvite: null,
            });

            setMatchedUser(displayUser);
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
          name: displayUser.name,
          age: displayUser.age,
          image: displayUser.images[0],
          messages: [],
          matchedAt: 'now',
          activeGameId: null,
          pendingInvite: null,
        });
        setMatchedUser(displayUser);
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
      navigation.navigate('PremiumPaywall');
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
      navigation.navigate('PremiumPaywall');
      return;
    }
    handleSwipe('right');
    ToastAndroid.show('🌟 Superliked!', ToastAndroid.SHORT);
  };

  const handleBoost = () => {
    if (!isPremiumUser && !devMode) {
      navigation.navigate('PremiumPaywall');
      return;
    }
    setBoostActive(true);
    ToastAndroid.show('Boost activated!', ToastAndroid.SHORT);
    setTimeout(() => setBoostActive(false), 5000);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          Animated.timing(pan, {
            toValue: { x: 500, y: 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => handleSwipe('right'));
        } else if (gesture.dx < -120) {
          Animated.timing(pan, {
            toValue: { x: -500, y: 0 },
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

  const handleGameInvite = () => {
    if (!displayUser) return;
    navigation.navigate('GameInvite', { user: displayUser });
  };

  const gradientColors = [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <Header />
      <View style={styles.container}>
        {displayUser ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
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
              styles.card,
            ]}
          >
            <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
              <Text style={[styles.badgeText, styles.likeText]}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
              <Text style={[styles.badgeText, styles.nopeText]}>NOPE</Text>
            </Animated.View>
            <TouchableOpacity
              onPress={() => setImageIndex((i) => (i + 1) % displayUser.images.length)}
            >
              <Image source={displayUser.images[imageIndex]} style={styles.image} />
            </TouchableOpacity>
            <View style={styles.info}>
              <Text style={styles.name}>
                {displayUser.name}, {displayUser.age}
              </Text>
              <Text style={styles.bio}>{displayUser.bio}</Text>
            </View>
          </Animated.View>
        ) : (
          <Text style={styles.noMoreText}>No more users</Text>
        )}

        <View style={styles.buttonRow}>
          {[
            { icon: 'refresh', color: '#facc15', action: rewind },
            { icon: 'close', color: '#f87171', action: () => handleSwipe('left') },
            { icon: 'star', color: '#60a5fa', action: handleSuperLike },
            { icon: 'game-controller', color: '#a78bfa', action: handleGameInvite },
            { icon: 'heart', color: '#ff75b5', action: () => handleSwipe('right') },
            { icon: 'flash', color: '#d81b60', action: handleBoost },
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
                source={require('../assets/fireworks.json')}
                autoPlay
                loop={false}
                style={{ width: 300, height: 300 }}
              />
              <Text style={styles.matchText}>It's a Match with {matchedUser.name}!</Text>
            </View>
          </Modal>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '75%',
  },
  info: {
    padding: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  bio: {
    fontSize: 16,
    marginTop: 6,
    color: '#666',
  },
  noMoreText: {
    fontSize: 20,
    color: '#999',
    textAlign: 'center',
    marginTop: 60,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
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
});

export default SwipeScreen;
