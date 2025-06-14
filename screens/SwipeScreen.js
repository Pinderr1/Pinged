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
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HEIGHT = 520;
const MAX_LIKES = 100;

const allUsers = [
  {
    id: '1',
    name: 'Emily',
    age: 24,
    bio: 'Let’s play chess and chill 🧠',
    images: [require('../assets/user1.jpg')],
  },
  {
    id: '2',
    name: 'Liam',
    age: 28,
    bio: 'Pro gamer looking for my co-op partner 🎮',
    images: [require('../assets/user2.jpg')],
  }
];

const SwipeScreen = () => {
  const { darkMode } = useTheme();
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const { user: currentUser } = useUser();
  const isPremiumUser = !!currentUser?.isPremium;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likesUsed, setLikesUsed] = useState(0);
  const [matchedUser, setMatchedUser] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const displayUser = allUsers[currentIndex] ?? null;

  const handleSwipe = (direction) => {
    if (!displayUser) return;

    if (direction === 'right') {
      if (likesUsed >= MAX_LIKES && !isPremiumUser) {
        Alert.alert('Upgrade to Premium', 'You’ve hit your daily like limit.');
        return;
      }
      setLikesUsed((prev) => prev + 1);
      setMatchedUser(displayUser);
      setShowFireworks(true);
      showNotification(`You liked ${displayUser.name}`);
      setTimeout(() => setShowFireworks(false), 2000);
    }

    pan.setValue({ x: 0, y: 0 });
    setImageIndex(0);
    setCurrentIndex((i) => i + 1);
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

  const gradientColors = darkMode ? ['#1a1a1a', '#0f0f0f'] : ['#ffe3ec', '#fff'];

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
            <TouchableOpacity
              onPress={() =>
                setImageIndex((i) => (i + 1) % displayUser.images.length)
              }
            >
              <Image
                source={displayUser.images[imageIndex]}
                style={styles.image}
              />
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
          <TouchableOpacity
            onPress={() => handleSwipe('left')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>❌</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGameInvite}
            style={styles.button}
          >
            <Text style={styles.buttonText}>🎮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSwipe('right')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>❤️</Text>
          </TouchableOpacity>
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
    marginTop: 20,
  },
  button: {
    backgroundColor: '#ff75b5',
    marginHorizontal: 10,
    padding: 14,
    borderRadius: 40,
    elevation: 3,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
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
