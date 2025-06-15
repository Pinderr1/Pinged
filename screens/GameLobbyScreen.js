import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import styles from '../styles';
import { games } from '../games';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GameLobbyScreen = ({ route, navigation }) => {
  const { darkMode } = useTheme();
  const { devMode } = useDev();
  const { recordGamePlayed } = useGameLimit();
  const { game, opponent, status = 'waiting' } = route.params || {};
  const [showGame, setShowGame] = useState(false);
  const [devPlayer, setDevPlayer] = useState('0');
  const GameComponent = game?.id ? games[game.id]?.Client : null;

  const isReady = devMode || status === 'ready';

  if (!game || !opponent) {
    return (
      <LinearGradient
        colors={darkMode ? ['#444', '#222'] : ['#fff', '#ffe6f0']}
        style={styles.swipeScreen}
      >
        <Header showLogoOnly />
        <Text style={{ marginTop: 80, color: darkMode ? '#fff' : '#000' }}>
          Invalid game data.
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={darkMode ? ['#444', '#222'] : ['#fff', '#ffe6f0']}
      style={styles.swipeScreen}
    >
      <Header showLogoOnly />

      {/* Game Info */}
      <View style={{ alignItems: 'center', marginTop: 70, marginBottom: 20 }}>
        <MaterialCommunityIcons name="controller-classic" size={34} color={darkMode ? '#fff' : '#d81b60'} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: darkMode ? '#fff' : '#000' }}>
          {game.title}
        </Text>
      </View>

      {/* Players Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 30 }}>
        {/* You */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('../assets/user1.jpg')}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: darkMode ? '#fff' : '#222' }}>
            You
          </Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d81b60' }}>VS</Text>

        {/* Opponent */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={opponent?.photo || require('../assets/user2.jpg')}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: darkMode ? '#fff' : '#222' }}>
            {opponent?.name || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <Text style={{ textAlign: 'center', color: darkMode ? '#aaa' : '#666', marginBottom: 30 }}>
        {isReady ? 'Both players are ready!' : 'Waiting for opponent to accept...'}
      </Text>

      {/* Buttons */}
      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: isReady ? '#28c76f' : '#ccc',
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 12
          }}
          disabled={!isReady}
          onPress={() => {
            setShowGame(true);
            recordGamePlayed();
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Play Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#facc15',
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 12
          }}
          onPress={() =>
            navigation.navigate('Chat', {
              user: {
                id: opponent?.id,
                name: opponent?.name,
                image: opponent?.photo,
              },
              gameId: game.id,
            })
          }
        >
          <Text style={{ color: '#000', fontWeight: '600' }}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#d81b60',
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center'
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel Invite</Text>
        </TouchableOpacity>
      </View>

      {showGame && GameComponent && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {devMode && (
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setDevPlayer('0')}
                style={{
                  backgroundColor: devPlayer === '0' ? '#d81b60' : '#ccc',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#fff' }}>Player 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDevPlayer('1')}
                style={{
                  backgroundColor: devPlayer === '1' ? '#d81b60' : '#ccc',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: '#fff' }}>Player 2</Text>
              </TouchableOpacity>
            </View>
          )}
          <GameComponent playerID={devMode ? devPlayer : '0'} matchID="dev" />
        </View>
      )}
    </LinearGradient>
  );
};

export default GameLobbyScreen;
