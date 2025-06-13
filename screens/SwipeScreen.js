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
  Alert,
  StyleSheet,
  ToastAndroid
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HEIGHT = 520;
const MAX_LIKES = 100;

const allUsers = [
  {
    id: '1',
    name: 'Liam',
    age: 27,
    distance: '2 km away',
    bio: 'Game dev + poker shark.',
    images: [
      require('../assets/user1.jpg'),
      require('../assets/user1_b.jpg'),
      require('../assets/user1_c.jpg')
    ],
    interests: ['Chess', 'Poker', 'Coding'],
    favoriteGame: 'Chess',
    verified: true,
    new: false,
    online: true
  },
  {
    id: '2',
    name: 'Emily',
    age: 25,
    distance: '5 km away',
    bio: 'Loves chess and memes.',
    images: [
      require('../assets/user2.jpg'),
      require('../assets/user2_b.jpg'),
      require('../assets/user2_c.jpg')
    ],
    interests: ['Chess', 'Memes', 'Music'],
    favoriteGame: 'Checkers',
    verified: false,
    new: true,
    online: false
  },
  {
    id: '3',
    name: 'Sophie',
    age: 24,
    distance: '3 km away',
    bio: 'Musician. Armpit connoisseur.',
    images: [require('../assets/user3.jpg')],
    interests: ['Music', 'Art'],
    favoriteGame: 'Truth or Dare',
    verified: true,
    new: true,
    online: true
  },
  {
    id: '4',
    name: 'Noah',
    age: 28,
    distance: '8 km away',
    bio: 'Code + cuddle?',
    images: [require('../assets/user4.jpg')],
    interests: ['Coding', 'Cuddles'],
    favoriteGame: 'Rock Paper Scissors',
    verified: false,
    new: false,
    online: false
  }
];

const SwipeScreen = () => {
  const { darkMode } = useTheme();
  const navigation = useNavigation();
  const { showNotification } = useNotification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likesUsed, setLikesUsed] = useState(0);
  const [matchedUser, setMatchedUser] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [swipeLabel, setSwipeLabel] = useState('');

  const pan = useRef(new Animated.ValueXY()).current;
  const swipeLabelOpacity = useRef(new Animated.Value(0)).current;
  const scaleRefs = useRef(Array(6).fill(null).map(() => new Animated.Value(1))).current;
  const swipedUserRef = useRef(null);

  const user = allUsers[currentIndex] ?? null;
  const nextUser = allUsers[currentIndex + 1] ?? null;

  const playSound = async (asset) => {
    try {
      const { sound } = await Audio.Sound.createAsync(asset);
      await sound.playAsync();
    } catch (e) {
      console.warn('Sound error:', e);
    }
  };

  const showSwipeLabel = (text) => {
    setSwipeLabel(text);
    swipeLabelOpacity.setValue(1);
    Animated.timing(swipeLabelOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true
    }).start();
  };
  const handleSwipe = (direction, superlike = false) => {
    const swipedUser = allUsers[currentIndex];
    if (!swipedUser) return;

    swipedUserRef.current = swipedUser;

    if (direction === 'right') {
      if (!superlike && likesUsed >= MAX_LIKES && !isPremiumUser) {
        Alert.alert('Limit Reached', 'You hit your daily like limit.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound(require('../assets/swipe-like.mp3'));
      showSwipeLabel(superlike ? 'SUPERLIKE' : 'LIKE');

      if (!superlike) setLikesUsed((l) => l + 1);
      if (superlike) ToastAndroid.show('🌟 Superliked!', ToastAndroid.SHORT);

      if ((currentIndex + 1) % 2 === 0) {
        playSound(require('../assets/match-sound.mp3'));
        setMatchedUser(swipedUser);
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 3000);
      }
    } else if (direction === 'left') {
      playSound(require('../assets/swipe-pass.mp3'));
      showSwipeLabel('NOPE');
    }

    setImageIndex(0);
    pan.setValue({ x: 0, y: 0 });
    setCurrentIndex((i) => i + 1);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -100) {
          handleSwipe('right', true);
        } else if (gesture.dx > 120) {
          Animated.timing(pan, {
            toValue: { x: 500, y: gesture.dy },
            duration: 200,
            useNativeDriver: false
          }).start(() => handleSwipe('right'));
        } else if (gesture.dx < -120) {
          Animated.timing(pan, {
            toValue: { x: -500, y: gesture.dy },
            duration: 200,
            useNativeDriver: false
          }).start(() => handleSwipe('left'));
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const nextImage = () => {
    if (!user?.images) return;
    setImageIndex((prev) => (prev + 1) % user.images.length);
  };

  const prevImage = () => {
    if (!user?.images) return;
    setImageIndex((prev) => (prev - 1 + user.images.length) % user.images.length);
  };

  const handleImageTap = (evt) => {
    const tapX = evt.nativeEvent.locationX;
    const cardWidth = evt.nativeEvent.source?.width || SCREEN_WIDTH;
    if (tapX < cardWidth / 2) {
      prevImage();
    } else {
      nextImage();
    }
  };

  const triggerGameRequest = () => {
    if (!user) return;
    navigation.navigate('GameInvite', { user });
  };
  return (
    <LinearGradient
      colors={darkMode ? ['#121212', '#1e1e1e'] : ['#FF75B5', '#FF9A75']}
      style={[styles.swipeScreen, { paddingTop: 10 }]}
    >
      <Header showLogoOnly />

      {user && (
        <>
          {nextUser && (
            <View style={[s.card, s.nextCard]}>
              <Image source={nextUser.images[0]} style={s.cardImage} />
            </View>
          )}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              s.card,
              {
                transform: [...pan.getTranslateTransform()],
                zIndex: 2,
                backgroundColor: darkMode ? '#000' : '#fff'
              }
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleImageTap}
              style={{ flex: 1 }}
            >
              <Image source={user.images[imageIndex]} style={s.cardImage} />
              {user.online && <View style={s.onlineDot} />}
              {user.verified && (
                <View style={s.badge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                  <Text style={s.badgeText}>Verified</Text>
                </View>
              )}
              {user.new && (
                <View style={[s.badge, { top: 34, backgroundColor: '#2196f3' }]}>
                  <Text style={s.badgeText}>New</Text>
                </View>
              )}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={s.cardInfo}>
                <View style={s.infoRow}>
                  <View>
                    <Text style={s.cardName}>
                      {user.name}, {user.age}
                    </Text>
                    <Text style={s.cardBio} numberOfLines={2}>
                      {user.bio}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(`${user.name}'s Full Profile`, 'More profile info coming soon.')
                    }
                  >
                    <Ionicons name="information-circle-outline" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {!user && (
        <Text style={[styles.logoText, { color: darkMode ? '#fff' : '#d81b60' }]}>
          No more users
        </Text>
      )}

      {matchedUser && (
        <Modal transparent animationType="fade" visible={!!matchedUser}>
          <View style={s.matchOverlay}>
            {showFireworks && (
              <LottieView
                source={require('../assets/fireworks.json')}
                autoPlay
                loop={false}
                style={s.fireworks}
              />
            )}
            <View style={s.matchModal}>
              <Text style={s.matchText}>It's a Match!</Text>
              <View style={s.matchedImages}>
                <Image source={matchedUser.images[0]} style={s.matchImage} />
                <Image
                  source={require('../assets/self.jpg')}
                  style={s.matchImage}
                />
              </View>
              <TouchableOpacity
                style={s.matchButton}
                onPress={() => setMatchedUser(null)}
              >
                <Text style={s.matchBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {user && (
        <View style={s.buttonsRow}>
          {[
            {
              icon: 'close',
              bg: '#ff4d4d',
              onPress: () => handleSwipe('left')
            },
            {
              icon: 'star',
              bg: '#ffca28',
              onPress: () => {
                if (!isPremiumUser) return setPremiumModalVisible(true);
                handleSwipe('right', true);
              }
            },
            {
              icon: 'gamepad-variant',
              bg: '#4287f5',
              onPress: triggerGameRequest,
              lib: 'MaterialCommunityIcons'
            },
            {
              icon: 'heart',
              bg: '#28c76f',
              onPress: () => handleSwipe('right')
            },
            {
              icon: 'refresh',
              bg: '#facc15',
              onPress: () => setPremiumModalVisible(true)
            },
            {
              icon: 'flash',
              bg: '#c084fc',
              onPress: () => setBoostActive(true)
            }
          ].map((btn, i) => {
            const IconSet = btn.lib === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
            return (
              <Animated.View key={i} style={{ transform: [{ scale: scaleRefs[i] }] }}>
                <TouchableOpacity
                  onPressIn={() =>
                    Animated.spring(scaleRefs[i], {
                      toValue: 0.9,
                      useNativeDriver: true
                    }).start()
                  }
                  onPressOut={() =>
                    Animated.spring(scaleRefs[i], {
                      toValue: 1,
                      friction: 3,
                      useNativeDriver: true
                    }).start()
                  }
                  onPress={btn.onPress}
                  style={[s.actionBtn, { backgroundColor: btn.bg }]}
                >
                  <IconSet name={btn.icon} size={24} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      <Modal transparent animationType="slide" visible={premiumModalVisible}>
        <View style={s.premiumOverlay}>
          <View style={s.premiumModal}>
            <Text style={s.premiumTitle}>Go Premium</Text>
            <Text style={s.premiumText}>Unlock Superlikes, Rewinds, and Boosts.</Text>
            <TouchableOpacity
              style={s.premiumBtn}
              onPress={() => {
                setPremiumModalVisible(false);
                navigation.navigate('PremiumPaywall');
              }}
            >
              <Text style={s.premiumBtnText}>Upgrade Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPremiumModalVisible(false)}
              style={s.premiumCancel}
            >
              <Text style={s.premiumCancelText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 32,
    height: CARD_HEIGHT,
    borderRadius: 20,
    position: 'absolute',
    alignSelf: 'center',
    overflow: 'hidden',
    top: 80,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8
  },
  nextCard: {
    zIndex: 1,
    transform: [{ scale: 0.96 }, { translateY: 8 }]
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff'
  },
  cardBio: {
    fontSize: 14,
    color: '#eee',
    marginTop: 4
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: CARD_HEIGHT + 100
  },
  actionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center'
  },
  onlineDot: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#fff'
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  matchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  matchModal: {
    alignItems: 'center',
    paddingHorizontal: 20
  },
  matchText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16
  },
  matchImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  matchImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginHorizontal: 10
  },
  matchName: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16
  },
  matchButton: {
    backgroundColor: '#FF75B5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20
  },
  matchBtnText: {
    color: '#fff',
    fontWeight: '600'
  },
  fireworks: {
    width: 300,
    height: 300,
    position: 'absolute',
    top: 0
  },
  premiumOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  premiumModal: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center'
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  premiumText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center'
  },
  premiumBtn: {
    backgroundColor: '#B28DFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  premiumBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  premiumCancel: {
    marginTop: 12
  },
  premiumCancelText: {
    color: '#999',
    fontSize: 14
  }
});

export default SwipeScreen;
