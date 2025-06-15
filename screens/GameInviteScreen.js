import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import styles from '../styles';

const MATCHES = [
  { id: '1', name: 'Liam', photo: require('../assets/user1.jpg'), online: true },
  { id: '2', name: 'Emily', photo: require('../assets/user2.jpg'), online: false },
  { id: '3', name: 'Sophie', photo: require('../assets/user3.jpg'), online: true },
  { id: '4', name: 'Noah', photo: require('../assets/user4.jpg'), online: false },
  { id: '5', name: 'Alex', photo: require('../assets/user1.jpg'), online: true },
  { id: '6', name: 'Mia', photo: require('../assets/user2.jpg'), online: false },
  { id: '7', name: 'Lucas', photo: require('../assets/user3.jpg'), online: true },
  { id: '8', name: 'Ava', photo: require('../assets/user4.jpg'), online: false }
];

const devUser = {
  id: '__devUser',
  name: 'Dev Tester',
  photo: require('../assets/user1.jpg'),
  online: true,
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH / 2 - 24;

const GameInviteScreen = ({ route, navigation }) => {
  const game = route?.params?.game ?? { title: 'a game' };
  const { darkMode } = useTheme();
  const { devMode } = useDev();
  const [search, setSearch] = useState('');
  const [invited, setInvited] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const matches = devMode ? [devUser, ...MATCHES] : MATCHES;

  const handleInvite = (user) => {
    setInvited((prev) => ({ ...prev, [user.id]: true }));
    setLoadingId(user.id);

    const toLobby = () =>
      navigation.navigate('GameLobby', {
        game: { title: game.title },
        opponent: { id: user.id, name: user.name, photo: user.photo },
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
          backgroundColor: darkMode ? '#2c2c2c' : '#fff',
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
          <Text style={{ fontSize: 15, fontWeight: '600', color: darkMode ? '#fff' : '#000' }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 12, color: item.online ? '#2ecc71' : '#999', marginBottom: 6 }}>
            {item.online ? 'Online' : 'Offline'}
          </Text>

          {isInvited && isLoading ? (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <ActivityIndicator size="small" color="#d81b60" />
              <Text style={{ color: darkMode ? '#ccc' : '#555', fontSize: 12, marginTop: 4 }}>
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
      colors={darkMode ? ['#2c2c2c', '#1b1b1b'] : ['#fff', '#ffe6f0']}
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
              color: darkMode ? '#fff' : '#000'
            }}
          >
            Invite to play {game.title}
          </Text>

          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 10,
              backgroundColor: darkMode ? '#333' : '#fff',
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
                color: darkMode ? '#fff' : '#000',
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
