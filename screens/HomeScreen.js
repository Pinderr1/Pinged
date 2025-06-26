import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useChats } from '../contexts/ChatContext';
import { allGames } from '../data/games';
import { getRandomBot } from '../ai/bots';
import ProgressBar from '../components/ProgressBar';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { matches } = useChats();
  const isPremiumUser = !!user?.isPremium;
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playTarget, setPlayTarget] = useState('stranger');

  const quickPlayOptions = [
    { key: 'match', title: 'Invite Match', emoji: '👥' },
    { key: 'stranger', title: 'Stranger', emoji: '🎮' },
    { key: 'ai', title: 'Play AI', emoji: '🤖' },
  ];

  const openGamePicker = (target) => {
    if (target === 'ai' || gamesLeft > 0 || isPremiumUser) {
      setPlayTarget(target);
      setGamePickerVisible(true);
    } else {
      navigation.navigate('PremiumPaywall');
    }
  };

  const selectGame = (game) => {
    const isLocked = !isPremiumUser && game.premium;
    if (isLocked) {
      setGamePickerVisible(false);
      navigation.navigate('PremiumPaywall');
      return;
    }
    setGamePickerVisible(false);
    if (playTarget !== 'ai') {
      recordGamePlayed();
    }
    if (playTarget === 'stranger') {
      navigation.navigate('Play');
    } else if (playTarget === 'ai') {
      const bot = getRandomBot();
      navigation.navigate('GameWithBot', { botId: bot.id, game: game.id });
    } else {
      navigation.navigate('GameInvite', { game: { id: game.id, title: game.title } });
    }
  };

  const level = Math.floor((user?.xp || 0) / 100);
  const xpProgress = (user?.xp || 0) % 100;
  const streakProgress = Math.min((user?.streak || 0) % 7, 7);

  const gradientColors = [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header showLogoOnly />
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={[local.welcome, { color: theme.text }]}>\
{`Welcome${user?.displayName ? `, ${user.displayName}` : ''}!`}</Text>
          <View style={[local.progressCard, { backgroundColor: theme.card }]}>
            <Text style={[local.levelText, { color: theme.text }]}>{`Level ${level}`}</Text>
            <ProgressBar value={xpProgress} max={100} color={theme.accent} />
            <Text style={[local.streakLabel, { color: theme.textSecondary }]}>{`${user?.streak || 0} day streak`}</Text>
            <ProgressBar value={streakProgress} max={7} color="#2ecc71" />
          </View>

          <Text style={local.section}>Quick Play</Text>
          <FlatList
            data={quickPlayOptions}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={local.carousel}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[local.tile, { backgroundColor: theme.card }]}
                onPress={() => openGamePicker(item.key)}
              >
                <Text style={local.tileEmoji}>{item.emoji}</Text>
                <Text style={[local.tileText, { color: theme.text }]}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />

          <Text style={local.section}>Your Matches</Text>
          <FlatList
            data={matches}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={local.carousel}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[local.matchTile, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate('Chat', { user: item })}
              >
                <Image source={item.image} style={local.matchAvatar} />
                <Text style={[local.matchName, { color: theme.text }]}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />

          <Text style={local.section}>Suggested Games</Text>
          <FlatList
            data={allGames.slice(0, 10)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[local.carousel, { paddingBottom: 20 }]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[local.gameTile, { backgroundColor: theme.card }]}
                onPress={() => {
                  setPlayTarget('match');
                  selectGame(item);
                }}
              >
                <View style={{ marginBottom: 8 }}>{item.icon}</View>
                <Text style={[local.gameTitle, { color: theme.text }]}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </ScrollView>

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
                <Text style={{ color: '#d81b60' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const local = StyleSheet.create({
  welcome: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#ff4081',
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  carousel: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tile: {
    width: 120,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  tileEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  tileText: {
    fontSize: 14,
    fontWeight: '500',
  },
  matchTile: {
    width: 120,
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  matchName: {
    fontSize: 13,
    fontWeight: '600',
  },
  gameTile: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
});

export default HomeScreen;
