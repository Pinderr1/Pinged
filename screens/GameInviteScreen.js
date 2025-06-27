import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions
} from 'react-native';
import Loader from '../components/Loader';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import styles from '../styles';
import { db } from '../firebase';
import { useUser } from '../contexts/UserContext';
import Toast from 'react-native-toast-message';

const devUser = {
  id: '__devUser',
  name: 'Dev Tester',
  photo: require('../assets/user1.jpg'),
  online: true,
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH / 2 - 24;

const GameInviteScreen = ({ route, navigation }) => {
  const rawGame = route?.params?.game;
  const gameTitle = typeof rawGame === 'string' ? rawGame : rawGame?.title || 'a game';
  const gameId = typeof rawGame === 'object' ? rawGame.id : null;
  const { darkMode, theme } = useTheme();
  const { devMode } = useDev();
  const { user: currentUser } = useUser();
  const { sendGameInvite } = useMatchmaking();
  const { gamesLeft } = useGameLimit();
  const [search, setSearch] = useState('');
  const [invited, setInvited] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (!currentUser?.isPremium && gamesLeft <= 0 && !devMode) {
      navigation.replace('Premium', { context: 'paywall' });
    }
  }, [gamesLeft, currentUser?.isPremium, devMode]);

  useEffect(() => {
    if (!currentUser) return;
    const q = currentUser.uid
      ? db.collection('users').where('uid', '!=', currentUser.uid)
      : db.collection('users');
    const unsub = q.onSnapshot(
      (snap) => {
        let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (devMode) data = [devUser, ...data];
        setMatches(
          data.map((u) => ({
            id: u.uid || u.id,
            name: u.displayName || 'User',
            photo: u.photoURL ? { uri: u.photoURL } : require('../assets/user1.jpg'),
            online: !!u.online,
          }))
        );
      },
      (e) => console.warn('Failed to load users', e)
    );
    return unsub;
  }, [currentUser?.uid, devMode]);

  const handleInvite = async (user) => {
    const isPremiumUser = !!currentUser?.isPremium;
    if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }

    setInvited((prev) => ({ ...prev, [user.id]: true }));
    setLoadingId(user.id);

    const inviteId = await sendGameInvite(user.id, gameId);
    Toast.show({ type: 'success', text1: 'Invite sent!' });

    const toLobby = () =>
      navigation.navigate('GameSession', {
        game: { id: gameId, title: gameTitle },
        opponent: { id: user.id, name: user.name, photo: user.photo },
        inviteId,
        status: devMode ? 'ready' : 'waiting',
      });

    if (devMode) {
      console.log('Auto-accepting invite');
      toLobby();
    } else {
      setTimeout(toLobby, 2000);
    }
  };

  const filtered = matches.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderUserCard = ({ item }) => {
    const isInvited = invited[item.id];
    const isLoading = loadingId === item.id;

    return (
      <View
        style={{
          backgroundColor: theme.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: darkMode ? '#333' : '#eee',
          padding: 12,
          margin: 8,
          width: CARD_WIDTH,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Image
            source={item.photo}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              marginBottom: 8
            }}
          />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 12, color: item.online ? '#2ecc71' : '#999', marginBottom: 6 }}>
            {item.online ? 'Online' : 'Offline'}
          </Text>

          {isInvited && isLoading ? (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Loader size="small" />
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                Waiting for {item.name}...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: '#d81b60',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginTop: 6
              }}
              onPress={() => handleInvite(item)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Invite</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.swipeScreen}
    >
      <Header showLogoOnly />
      <SafeKeyboardView style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: 36,
              marginBottom: 12,
              color: theme.text
            }}
          >
            Invite to play {gameTitle}
          </Text>

          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 10,
              backgroundColor: theme.card,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8
            }}
          >
            <TextInput
              placeholder="Search matches..."
              placeholderTextColor={darkMode ? '#aaa' : '#999'}
              value={search}
              onChangeText={setSearch}
              style={{
                fontSize: 14,
                color: theme.text,
                paddingVertical: 4
              }}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderUserCard}
            numColumns={2}
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingBottom: 100,
              justifyContent: 'space-between'
            }}
            columnWrapperStyle={{
              justifyContent: 'space-between'
            }}
            removeClippedSubviews={false}
          />
      </SafeKeyboardView>
    </LinearGradient>
  );
};

export default GameInviteScreen;
