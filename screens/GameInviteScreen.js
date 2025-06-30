import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Loader from '../components/Loader';
import SafeKeyboardView from '../components/SafeKeyboardView';
import Card from '../components/Card';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import PropTypes from 'prop-types';
import styles from '../styles';
import { useChats } from '../contexts/ChatContext';
import { useUser } from '../contexts/UserContext';
import Toast from 'react-native-toast-message';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import useCardPressAnimation from '../hooks/useCardPressAnimation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH / 2 - 24;

const GameInviteScreen = ({ route, navigation }) => {
  const rawGame = route?.params?.game;
  const gameTitle = typeof rawGame === 'string' ? rawGame : rawGame?.title || 'a game';
  const gameId = typeof rawGame === 'object' ? rawGame.id : null;
  const { darkMode, theme } = useTheme();
  const { devMode } = useDev();
  const { user: currentUser } = useUser();
  const { matches: chatMatches } = useChats();
  const { sendGameInvite } = useMatchmaking();
  const { gamesLeft } = useGameLimit();
  const requireCredits = useRequireGameCredits();
  const [search, setSearch] = useState('');
  const [invited, setInvited] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    requireCredits({ replace: true });
  }, [gamesLeft, currentUser?.isPremium, devMode]);

  useEffect(() => {
    setMatches(
      chatMatches.map((m) => ({
        id: m.otherUserId,
        name: m.name,
        photo: m.image,
        online: m.online,
      }))
    );
  }, [chatMatches]);

  const handleInvite = async (user, animateSuccess) => {
    const isPremiumUser = !!currentUser?.isPremium;
    if (!requireCredits()) return;

    setInvited((prev) => ({ ...prev, [user.id]: true }));
    setLoadingId(user.id);

    let inviteId;
    try {
      inviteId = await sendGameInvite(user.id, gameId);
      Toast.show({ type: 'success', text1: 'Invite sent!' });
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      // TODO: play success sound here
      if (animateSuccess) animateSuccess();
    } catch (e) {
      console.warn('Failed to send game invite', e);
      Toast.show({ type: 'error', text1: 'Failed to send invite' });
      setInvited((prev) => ({ ...prev, [user.id]: false }));
      setLoadingId(null);
      return;
    }

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

    const {
      scale,
      handlePressIn,
      handlePressOut,
      playSuccess,
    } = useCardPressAnimation();

    return (
      <Card
        style={{
          backgroundColor: theme.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: darkMode ? '#333' : '#eee',
          padding: 12,
          margin: 8,
          width: CARD_WIDTH
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
            <Animated.View style={{ transform: [{ scale }] }}>
              <GradientButton
                text="Invite"
                onPress={() => handleInvite(item, playSuccess)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                width={120}
                style={{ marginTop: 6 }}
              />
            </Animated.View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <GradientBackground style={styles.swipeScreen}>
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
    </GradientBackground>
  );
};

GameInviteScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      game: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string,
        }),
      ]),
    }),
  }),
};

export default GameInviteScreen;
