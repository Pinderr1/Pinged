import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  FlatList
} from 'react-native';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useGameLimit } from '../contexts/GameLimitContext';


const GAMES = [
  { name: 'Tic Tac Toe', tier: 1 },
  { name: 'Checkers', tier: 2 },
  { name: 'Truth or Dare', tier: 1 },
  { name: 'Rock Paper Scissors', tier: 1 }
];

const MATCHES = [
  { id: '1', name: 'Liam', image: require('../assets/user1.jpg'), online: true },
  { id: '2', name: 'Emily', image: require('../assets/user2.jpg'), online: false },
  { id: '3', name: 'Sophie', image: require('../assets/user3.jpg'), online: true },
  { id: '4', name: 'Noah', image: require('../assets/user4.jpg'), online: true },
  { id: '5', name: 'Ava', image: require('../assets/user5.jpg'), online: false },
  { id: '6', name: 'Ethan', image: require('../assets/user6.jpg'), online: true }
];

const ACTIVE_GAMES = [
  { id: '1', name: 'Liam', image: require('../assets/user1.jpg'), game: 'Checkers', yourTurn: true },
  { id: '2', name: 'Ava', image: require('../assets/user5.jpg'), game: 'Truth or Dare', yourTurn: false },
  { id: '3', name: 'Ethan', image: require('../assets/user6.jpg'), game: 'Tic Tac Toe', yourTurn: true }
];

const HomeScreen = ({ navigation }) => {
  const { darkMode } = useTheme();
  const { user } = useUser();
  const isPremiumUser = !!user?.isPremium;
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playTarget, setPlayTarget] = useState('stranger');

  const card = (children, style = {}) => (
    <View style={[local.card, { backgroundColor: darkMode ? '#2c2c2c' : '#fff' }, style]}>
      {children}
    </View>
  );

  const openGamePicker = (target) => {
    if (gamesLeft > 0 || isPremiumUser) {
      setPlayTarget(target);
      setGamePickerVisible(true);
    } else {
      navigation.navigate('PremiumPaywall');
    }
  };

  const selectGame = (game) => {
    const isLocked = !isPremiumUser && game.tier > 1;
    if (isLocked) {
      setGamePickerVisible(false);
      navigation.navigate('PremiumPaywall');
      return;
    }
    setGamePickerVisible(false);
    recordGamePlayed();
    if (playTarget === 'stranger') {
      navigation.navigate('Play', { game: game.name });
    } else {
      navigation.navigate('GameInvite', { game: game.name });
    }
  };

  const onlineGlow = (isOnline) => ({
    borderWidth: 2,
    borderColor: isOnline ? '#00e676' : '#ccc',
    borderRadius: 32,
    padding: 2
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#1b1b1b' : '#fce4ec' }}>
      <View style={{ position: 'relative' }}>
        <Header showLogoOnly />
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={{ position: 'absolute', top: 14, right: 20 }}
        >
          <Text style={{ fontSize: 22 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 200, paddingTop: 80 }}>
        {/* 💎 Premium Banner */}
        <View style={local.premiumBanner}>
          <View style={{ flex: 1 }}>
            <Text style={local.premiumTitle}>💎 Try Premium</Text>
            <Text style={local.premiumSubtitle}>Unlimited games, boosts, and more</Text>
          </View>
          <TouchableOpacity style={local.upgradeBtn} onPress={() => navigation.navigate('PremiumPaywall')}>
            <Text style={local.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* 🎯 Your Matches */}
        <Text style={local.section}>Your Matches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 12 }}>
          {MATCHES.map((m) => (
            <View key={m.id} style={{ alignItems: 'center', marginRight: 16 }}>
              <View style={onlineGlow(m.online)}>
                <Image source={m.image} style={local.avatarRound} />
              </View>
              <Text style={local.nameSmall}>{m.name}</Text>
              <TouchableOpacity style={local.inviteMiniBtn} onPress={() => openGamePicker('match')}>
                <Text style={local.inviteMiniText}>Invite</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* 👥 Invite Match */}
        {card(
          <TouchableOpacity
            style={[styles.emailBtn, { backgroundColor: '#4287f5', alignSelf: 'center' }]}
            onPress={() => openGamePicker('match')}
          >
            <Text style={styles.btnText}>👥 Invite a Match to Play</Text>
          </TouchableOpacity>
        )}

        {/* 🕹️ Active Games */}
        <Text style={local.section}>Active Games</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 16 }}>
          {ACTIVE_GAMES.map((game) => (
            <View key={game.id} style={[local.activeGameCard, { backgroundColor: darkMode ? '#2c2c2c' : '#fff' }]}>
              <View style={{ alignItems: 'center' }}>
                <Image source={game.image} style={local.avatarRound} />
                <Text style={local.nameSmall}>{game.name}</Text>
                <Text style={[local.subText, { marginTop: 2, marginBottom: 6 }]}>
                  {game.game} • {game.yourTurn ? 'Your Turn 🔥' : 'Their Turn'}
                </Text>
                <TouchableOpacity
                  style={local.inviteMiniBtn}
                  onPress={() => navigation.navigate('Play', { game: game.game })}
                >
                  <Text style={local.inviteMiniText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 🔥 Suggested Match */}
        <Text style={local.section}>Suggested Match</Text>
        {card(
          <TouchableOpacity onPress={() => navigation.navigate('Chat', { user: 'Emily' })} style={local.row}>
            <Image source={require('../assets/user2.jpg')} style={local.suggestedImage} />
            <View>
              <Text style={local.name}>Emily</Text>
              <Text style={local.subText}>“Loves chess and cuddles.”</Text>
              <TouchableOpacity style={local.inviteBtn}>
                <Text style={local.inviteText}>Message</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* 🎮 Play With Stranger */}
        {card(
          <TouchableOpacity
            style={[styles.emailBtn, { alignSelf: 'center' }]}
            onPress={() => openGamePicker('stranger')}
          >
            <Text style={styles.btnText}>🎮 Play With Stranger</Text>
          </TouchableOpacity>
        )}

        {/* ✅ XP / Streak */}
        <Text style={local.section}>Level & Streak</Text>
        {card(
          <>
            <Text style={local.subText}>Level 3</Text>
            <View style={local.progressBar}>
              <View style={local.progressFill} />
            </View>
            <Text style={[local.subText, { marginTop: 6 }]}>🔥 Daily streak: 4 days</Text>
            <Text style={[local.subText, { marginTop: 6 }]}>🎁 You earned 1 Boost today!</Text>
          </>
        )}

        {/* 🌍 Community */}
        <Text style={local.section}>Community</Text>
        {card(
          <>
            <Text style={local.subText}>Join events and meet people through games.</Text>
            <TouchableOpacity
              style={[styles.emailBtn, { marginTop: 10 }]}
              onPress={() => navigation.navigate('Community')}
            >
              <Text style={styles.btnText}>🗓 View Events & Tournaments</Text>
            </TouchableOpacity>
            <Text style={[local.subText, { marginTop: 6 }]}>Upcoming: Truth or Dare Game Night – Friday 9PM</Text>
          </>
        )}

        {/* 🔥 Daily Highlights */}
        <Text style={local.section}>Today’s Highlights</Text>
        {card(
          <>
            <Text style={[local.subText, { marginBottom: 10 }]}>✅ You matched with 5 people this week!</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Play', { game: 'Truth or Dare' })}>
              <Text style={local.bottomTitle}>🎮 Game of the Day: Truth or Dare</Text>
              <Text style={local.subText}>175 people playing now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => alert('Thanks for your response!')}>
              <Text style={local.bottomTitle}>💬 Icebreaker of the Day</Text>
              <Text style={local.subText}>“What’s your guilty pleasure game?” (Tap to answer)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16 }}>
              <Text style={local.bottomTitle}>🔥 Featured Player</Text>
              <Text style={local.subText}>Sophie is on a 5-game streak 💘</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16 }}>
              <Text style={local.bottomTitle}>🏆 Challenge</Text>
              <Text style={local.subText}>Win 1 game today to earn a Boost</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16 }}>
              <Text style={local.bottomTitle}>✨ Upcoming Event</Text>
              <Text style={local.subText}>Flirty Game Week starts Monday 💋</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ❤️ Sticky Meet People Button */}
      <View style={local.stickyBtnContainer}>
        <TouchableOpacity style={styles.emailBtn} onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.btnText}>❤️ Meet People</Text>
        </TouchableOpacity>
      </View>

      {/* 🎮 Game Picker Modal */}
      <Modal visible={gamePickerVisible} transparent animationType="fade">
        <View style={local.modalBackdrop}>
          <View style={local.modalCard}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Choose a Game</Text>
            {GAMES.map((game, idx) => {
              const locked = !isPremiumUser && game.tier > 1;
              return (
                <TouchableOpacity
                  key={idx}
                  style={local.gameOption}
                  onPress={() => selectGame(game)}
                >
                  <Text style={{ fontSize: 15 }}>
                    {locked ? '🔒 ' : ''}{game.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={() => setGamePickerVisible(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: '#d81b60' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const local = StyleSheet.create({
  section: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8
  },
  card: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  suggestedImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2
  },
  subText: {
    color: '#888',
    fontSize: 13
  },
  inviteBtn: {
    marginTop: 8,
    backgroundColor: '#d81b60',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: 'flex-start'
  },
  inviteText: {
    color: '#fff',
    fontSize: 13
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24
  },
  avatarRound: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  nameSmall: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500'
  },
  inviteMiniBtn: {
    backgroundColor: '#d81b60',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4
  },
  inviteMiniText: {
    color: '#fff',
    fontSize: 11
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 6
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#28c76f'
  },
  premiumBanner: {
    backgroundColor: '#e1f5fe',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0277bd'
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#0288d1',
    marginTop: 2
  },
  upgradeBtn: {
    backgroundColor: '#0288d1',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },
  upgradeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13
  },
  bottomTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center'
  },
  gameOption: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1
  },
  filterBadge: {
    backgroundColor: '#fce4ec',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  badgeText: {
    color: '#d81b60',
    fontWeight: '500',
    fontSize: 13
  },
  stickyBtnContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4
  },
  activeGameCard: {
    padding: 12,
    borderRadius: 16,
    width: 140,
    marginRight: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }
});

export default HomeScreen;
