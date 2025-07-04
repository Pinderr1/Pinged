import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import SafeKeyboardView from '../components/SafeKeyboardView';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import GradientButton from '../components/GradientButton';
import Header from '../components/Header';
import SkeletonPlaceholder from '../components/SkeletonPlaceholder';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import PropTypes from 'prop-types';
import getGlobalStyles from '../styles';
import { useChats } from '../contexts/ChatContext';
import { useUser } from '../contexts/UserContext';
import Toast from 'react-native-toast-message';
import { HEADER_SPACING } from '../layout';
import EmptyState from '../components/EmptyState';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import InviteUserCard from '../components/InviteUserCard';
import { logDev } from '../utils/logger';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH / 2 - 24;
const INITIAL_LIMIT = 6;

const GameInviteScreen = ({ route, navigation }) => {
  const rawGame = route?.params?.game;
  const gameTitle = typeof rawGame === 'string' ? rawGame : rawGame?.title || 'a game';
  const gameId = typeof rawGame === 'object' ? rawGame.id : null;
  const { darkMode, theme } = useTheme();
  const styles = getGlobalStyles(theme);
  const { devMode } = useDev();
  const { user: currentUser } = useUser();
  const { matches: chatMatches, loading: matchesLoading } = useChats();
  const { sendGameInvite } = useMatchmaking();
  const { gamesLeft } = useGameLimit();
  const requireCredits = useRequireGameCredits();
  const [search, setSearch] = useState('');
  const [invited, setInvited] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    requireCredits({ replace: true });
  }, [gamesLeft, currentUser?.isPremium, devMode]);

  useEffect(() => {
    setMatches(
      chatMatches.map((m) => ({
        id: m.otherUserId,
        displayName: m.displayName,
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
      navigation.replace('GameSession', {
        game: { id: gameId, title: gameTitle },
        opponent: { id: user.id, displayName: user.displayName, photo: user.photo },
        inviteId,
        status: devMode ? 'ready' : 'waiting',
      });

    if (devMode) {
      logDev('Invite', 'Auto-accepting invite');
      toLobby();
    } else {
      setTimeout(toLobby, 2000);
    }
  };

  const [debouncedInvite, inviting] = useDebouncedCallback(handleInvite, 800);

  const filtered = matches.filter((u) =>
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = showAll || search
    ? filtered
    : filtered.slice(0, INITIAL_LIMIT);
  const showMore =
    !matchesLoading && !showAll && !search && filtered.length > INITIAL_LIMIT;

  const renderUserCard = ({ item }) => {
    const isInvited = invited[item.id];
    const isLoading = loadingId === item.id;

    return (
      <InviteUserCard
        item={item}
        onInvite={debouncedInvite}
        isInvited={isInvited}
        isLoading={isLoading}
        disabled={inviting}
        theme={theme}
        darkMode={darkMode}
        width={CARD_WIDTH}
      />
    );
  };

  const renderSkeletonCard = (_, idx) => (
    <Card
      key={`skeleton-${idx}`}
      style={{
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: darkMode ? '#333' : '#eee',
        padding: 12,
        margin: 8,
        width: CARD_WIDTH,
      }}
    >
      <SkeletonPlaceholder
        shapes={[
          { circle: true, size: 50, style: { alignSelf: 'center', marginBottom: 8 } },
          { width: 80, height: 16, borderRadius: 8, style: { alignSelf: 'center', marginBottom: 4 } },
          { width: 60, height: 12, borderRadius: 6, style: { alignSelf: 'center' } },
        ]}
      />
    </Card>
  );

  return (
    <GradientBackground style={styles.swipeScreen}>
      <Header showLogoOnly />
      <ScreenContainer style={{ paddingTop: HEADER_SPACING, paddingBottom: 100 }}>
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
            data={matchesLoading && matches.length === 0 ? Array.from({ length: INITIAL_LIMIT }) : displayed}
            keyExtractor={(item, index) =>
              matchesLoading && matches.length === 0 ? `skeleton-${index}` : item.id
            }
            renderItem={matchesLoading && matches.length === 0 ? renderSkeletonCard : renderUserCard}
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
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !matchesLoading && displayed.length === 0 ? (
                <EmptyState
                  text="No matches found."
                  image={require('../assets/logo.png')}
                />
              ) : null
            }
            ListFooterComponent={
              showMore ? (
                <TouchableOpacity
                  onPress={() => setShowAll(true)}
                  style={{ paddingVertical: 16 }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      color: theme.accent,
                      fontWeight: '600'
                    }}
                  >
                    Show More
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </SafeKeyboardView>
      </ScreenContainer>
    </GradientBackground>
  );
};

GameInviteScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
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
