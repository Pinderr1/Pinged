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
import { LinearGradient } from 'expo-linear-gradient';


const GAMES = [
  { name: 'Tic Tac Toe', tier: 1 },
  { name: 'Checkers', tier: 2 },
  { name: 'Truth or Dare', tier: 1 },
  { name: 'Rock Paper Scissors', tier: 1 }
];


const HomeScreen = ({ navigation }) => {
  const { darkMode } = useTheme();
  const { user } = useUser();
  const isPremiumUser = !!user?.isPremium;
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const [gamePickerVisible, setGamePickerVisible] = useState(false);
  const [playTarget, setPlayTarget] = useState('stranger');

  const card = (children, style = {}) => (
    <View style={[local.card, { backgroundColor: darkMode ? '#444' : '#fff' }, style]}>
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
      navigation.navigate('Play');
    } else {
      navigation.navigate('GameInvite', { game: { title: game.name } });
    }
  };

  const gradientColors = darkMode ? ['#444', '#222'] : ['#FF75B5', '#FF9A75'];

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
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
        <Text style={local.section}>
          {`Welcome${user?.displayName ? `, ${user.displayName}` : ''}!`}
        </Text>
        {card(
          <Text style={local.subText}>
            {gamesLeft === Infinity
              ? 'Unlimited games today'
              : `${gamesLeft} game${gamesLeft === 1 ? '' : 's'} left today`}
          </Text>
        )}

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

        {/* 👥 Invite a Match */}
        {card(
          <TouchableOpacity
            style={[styles.emailBtn, { backgroundColor: '#4287f5', alignSelf: 'center' }]}
            onPress={() => openGamePicker('match')}
          >
            <Text style={styles.btnText}>Invite a Match</Text>
          </TouchableOpacity>
        )}

        {/* 🎮 Play With Stranger */}
        {card(
          <TouchableOpacity
            style={[styles.emailBtn, { alignSelf: 'center' }]}
            onPress={() => openGamePicker('stranger')}
          >
            <Text style={styles.btnText}>Play With Stranger</Text>
          </TouchableOpacity>
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
    </LinearGradient>
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
