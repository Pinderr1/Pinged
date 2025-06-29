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
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useChats } from '../contexts/ChatContext';
import { allGames } from '../data/games';
import { games as gameRegistry } from '../games';
import { getRandomBot } from '../ai/bots';
import ProgressBar from '../components/ProgressBar';
import Card from '../components/Card';
import { SAMPLE_EVENTS, SAMPLE_POSTS } from '../data/community';
import { eventImageSource } from '../utils/avatar';

const games = allGames.map((g) => {
  const key = Object.keys(gameRegistry).find(
    (k) => gameRegistry[k].meta.title === g.title
  );
  return { id: g.id, key };
});

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { matches } = useChats();
  const isPremiumUser = !!user?.isPremium;
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playTarget, setPlayTarget] = useState('match');

  const shortcutActions = [
    { key: 'startChat', title: 'Start Chat', emoji: '💬' },
    { key: 'editProfile', title: 'Edit Profile', emoji: '📝' },
    { key: 'viewMatches', title: 'View Matches', emoji: '👥' },
  ];

  const quickPlayOptions = [
    { key: 'match', title: 'Invite Match', emoji: '👥' },
    { key: 'ai', title: 'Play AI', emoji: '🤖' },
    { key: 'browse', title: 'Browse Games', emoji: '🕹️' },
  ];

  const openGamePicker = (target) => {
    if (target === 'browse') {
      navigation.navigate('Play');
      return;
    }
    if (target === 'ai' || gamesLeft > 0 || isPremiumUser) {
      setPlayTarget(target);
      setGamePickerVisible(true);
    } else {
      navigation.navigate('Premium', { context: 'paywall' });
    }
  };

  const selectGame = (game) => {
    const isLocked = !isPremiumUser && game.premium;
    if (isLocked) {
      setGamePickerVisible(false);
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    setGamePickerVisible(false);
    if (playTarget !== 'ai') {
      recordGamePlayed();
    }
    if (playTarget === 'ai') {
      const bot = getRandomBot();
      const aiKeyMap = { rockPaperScissors: 'rps' };
      const aiGames = games
        .filter((g) => g.key && gameRegistry[g.key])
        .reduce((m, g) => ({ ...m, [g.id]: aiKeyMap[g.key] || g.key }), {});
      const gameKey = aiGames[game.id];
      navigation.navigate('GameWithBot', {
        botId: bot.id,
        game: gameKey || 'ticTacToe',
      });
    } else {
      navigation.navigate('GameInvite', { game: { id: game.id, title: game.title } });
    }
  };

  const handleShortcut = (key) => {
    if (key === 'startChat') {
      if (matches?.length) {
        navigation.navigate('Chat', { user: matches[0] });
      } else {
        navigation.navigate('Matches');
      }
    } else if (key === 'editProfile') {
      navigation.navigate('Profile', { editMode: true });
    } else if (key === 'viewMatches') {
      navigation.navigate('Matches');
    }
  };

  const level = Math.floor((user?.xp || 0) / 100);
  const xpProgress = (user?.xp || 0) % 100;
  const streakProgress = Math.min((user?.streak || 0) % 7, 7);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header showLogoOnly />
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={[local.welcome, { color: theme.text }]}>\
{`Welcome${user?.displayName ? `, ${user.displayName}` : ''}!`}</Text>
          <Card style={[local.progressCard, { backgroundColor: theme.card }]}>
            <Text style={[local.levelText, { color: theme.text }]}>{`Level ${level}`}</Text>
            <ProgressBar value={xpProgress} max={100} color={theme.accent} />
            <Text style={[local.streakLabel, { color: theme.textSecondary }]}>{`${user?.streak || 0} day streak`}</Text>
            <ProgressBar value={streakProgress} max={7} color="#2ecc71" />
          </Card>

        <Text style={local.section}>Shortcuts</Text>
        <FlatList
          data={shortcutActions}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={local.carousel}
          renderItem={({ item }) => (
            <Card
              onPress={() => handleShortcut(item.key)}
              style={[local.tile, { backgroundColor: theme.card }]}
            >
              <Text style={local.tileEmoji}>{item.emoji}</Text>
              <Text style={[local.tileText, { color: theme.text }]}>{item.title}</Text>
            </Card>
          )}
        />

          <Text style={local.section}>Quick Play</Text>
          <FlatList
            data={quickPlayOptions}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={local.carousel}
            renderItem={({ item }) => (
              <Card
                onPress={() => openGamePicker(item.key)}
                style={[local.tile, { backgroundColor: theme.card }]}
              >
                <Text style={local.tileEmoji}>{item.emoji}</Text>
                <Text style={[local.tileText, { color: theme.text }]}>{item.title}</Text>
              </Card>
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
              <Card
                onPress={() => navigation.navigate('Chat', { user: item })}
                style={[local.matchTile, { backgroundColor: theme.card }]}
              >
                <Image source={item.image} style={local.matchAvatar} />
                <Text style={[local.matchName, { color: theme.text }]}>{item.name}</Text>
              </Card>
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
              <Card
                onPress={() => {
                  setPlayTarget('match');
                  selectGame(item);
                }}
                style={[local.gameTile, { backgroundColor: theme.card }]}
              >
                <View style={{ marginBottom: 8 }}>{item.icon}</View>
                <Text style={[local.gameTitle, { color: theme.text }]}>{item.title}</Text>
              </Card>
            )}
          />

          <Text style={local.section}>Community</Text>
          {SAMPLE_EVENTS.map((event) => (
            <Card
              key={`e-${event.id}`}
              style={[local.eventCard, { backgroundColor: theme.card }]}
            >
              <Image source={eventImageSource(event.image)} style={local.eventImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[local.eventTitle, { color: theme.text }]}>{event.title}</Text>
                <Text style={local.eventTime}>{event.time}</Text>
                <Text style={[local.eventDesc, { color: theme.textSecondary }]}>
                  {event.description}
                </Text>
              </View>
            </Card>
          ))}
          {SAMPLE_POSTS.map((post) => (
            <Card
              key={`p-${post.id}`}
              style={[local.postCardPreview, { backgroundColor: theme.card }]}
            >
              <Text style={[local.postTitle, { color: theme.text }]}>{post.title}</Text>
              <Text style={local.postTime}>{post.time}</Text>
              <Text style={[local.postDesc, { color: theme.textSecondary }]}>{post.description}</Text>
            </Card>
          ))}
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
    </GradientBackground>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    padding: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    padding: 12,
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
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  eventImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 12,
    color: '#d81b60',
    marginBottom: 2,
  },
  eventDesc: {
    fontSize: 12,
  },
  postCardPreview: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
    color: '#d81b60',
    marginBottom: 2,
  },
  postDesc: {
    fontSize: 12,
  },
});

export default HomeScreen;
