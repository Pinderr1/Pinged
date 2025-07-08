import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import AvatarRing from '../components/AvatarRing';
import { useTheme } from '../contexts/ThemeContext';
import { useChats } from '../contexts/ChatContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import useRematchHistory from '../hooks/useRematchHistory';
import Toast from 'react-native-toast-message';
import PropTypes from 'prop-types';
import { HEADER_SPACING } from '../layout';
import EmptyState from '../components/EmptyState';

const SKELETON_NEW_COUNT = 5;
const SKELETON_CHAT_COUNT = 5;

const MatchesScreen = ({ navigation }) => {
  const { darkMode, theme } = useTheme();
  const { matches, loading, refreshMatches } = useChats();
  const { sendGameInvite } = useMatchmaking();
  const requireCredits = useRequireGameCredits();
  const history = useRematchHistory(matches);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading) setRefreshing(false);
  }, [loading]);

  const newMatches = matches.filter((m) => (m.messages || []).length === 0);
  const activeChats = matches.filter((m) => (m.messages || []).length > 0);
  const historyMatches = matches.filter((m) => history[m.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMatches();
  };

  const handlePlayAgain = async (match, gameId) => {
    if (!gameId || !match?.otherUserId) return;
    if (!requireCredits()) return;
    try {
      await sendGameInvite(match.otherUserId, gameId);
      Toast.show({ type: 'success', text1: 'Invite sent!' });
    } catch (e) {
      console.warn('Failed to send rematch invite', e);
    }
  };

  const skeletonColor = darkMode ? '#333333' : '#e0e0e0';

  const renderSkeletonNewMatch = (_, index) => (
    <View key={`skeleton-new-${index}`} style={styles.newMatch}>
      <View style={[styles.newAvatar, { backgroundColor: skeletonColor }]} />
      <View
        style={[
          styles.skeletonText,
          { backgroundColor: skeletonColor, width: 56 },
        ]}
      />
    </View>
  );

  const renderSkeletonChat = (_, index) => (
    <Card
      key={`skeleton-chat-${index}`}
      style={[styles.chatItem, { backgroundColor: theme.card }]}
    >
      <View style={styles.avatarColumn}>
        <View style={[styles.chatAvatar, { backgroundColor: skeletonColor }]} />
        <View
          style={[
            styles.skeletonText,
            {
              backgroundColor: skeletonColor,
              width: 56,
              marginTop: 4,
            },
          ]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={[
            styles.skeletonText,
            { backgroundColor: skeletonColor, width: '50%', height: 16, marginBottom: 6 },
          ]}
        />
        <View
          style={[
            styles.skeletonText,
            { backgroundColor: skeletonColor, width: '80%', height: 12 },
          ]}
        />
      </View>
    </Card>
  );

  const renderNewMatch = ({ item }) => (
    <TouchableOpacity
      style={styles.newMatch}
      onPress={() => navigation.navigate('Chat', { user: item })}
    >
      <AvatarRing
        source={item.image}
        overlay={item.avatarOverlay}
        size={56}
        isMatch
        isOnline={item.online}
        style={styles.newAvatar}
      />
      <Text style={[styles.newName, { color: theme.text }]} numberOfLines={1}>
        {item.displayName}
      </Text>
    </TouchableOpacity>
  );

  const renderChat = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('Chat', { user: item })}
      style={[styles.chatItem, { backgroundColor: theme.card }]}
    >
      <View style={styles.avatarColumn}>
        <AvatarRing
          source={item.image}
          overlay={item.avatarOverlay}
          size={48}
          isMatch
          isOnline={item.online}
          style={styles.chatAvatar}
        />
        <Text
          style={[styles.avatarName, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.displayName}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.chatName, { color: theme.text }]}>{item.displayName}</Text>
        {item.messages?.length ? (
          <Text
            style={[styles.chatPreview, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.messages[item.messages.length - 1].text}
          </Text>
        ) : null}
      </View>
    </Card>
  );

  const renderHistoryItem = (item) => {
    const hist = history[item.id];
    if (!hist) return null;
    const resultText =
      hist.lastResult === 'win'
        ? 'You won'
        : hist.lastResult === 'loss'
        ? 'You lost'
        : 'Draw';
    return (
      <Card
        key={`hist-${item.id}`}
        style={[styles.chatItem, { backgroundColor: theme.card }]}
      >
        <View style={styles.avatarColumn}>
          <AvatarRing
            source={item.image}
            overlay={item.avatarOverlay}
            size={48}
            isMatch
            isOnline={item.online}
            style={styles.chatAvatar}
          />
          <Text style={[styles.avatarName, { color: theme.text }]} numberOfLines={1}>
            {item.displayName}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.chatName, { color: theme.text }]}>{item.displayName}</Text>
          <Text style={[styles.chatPreview, { color: theme.textSecondary }]} numberOfLines={1}>
            Last game: {resultText}
          </Text>
          {hist.rematchPercent != null && (
            <Text style={[styles.chatPreview, { color: theme.textSecondary }]}>
              {hist.rematchPercent}% rematches
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handlePlayAgain(item, hist.gameId)}
          style={[styles.playBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.playText}>Play Again</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer>
        <Header />
        <View style={[styles.container, { paddingTop: HEADER_SPACING }]}>
          {loading ? (
            <>
              <Text style={styles.sectionTitle}>New Matches</Text>
              <FlatList
                data={Array.from({ length: SKELETON_NEW_COUNT })}
                keyExtractor={(_, i) => `sk-new-${i}`}
                renderItem={renderSkeletonNewMatch}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newList}
              />
              <Text style={styles.sectionTitle}>Active Chats</Text>
              {Array.from({ length: SKELETON_CHAT_COUNT }).map(renderSkeletonChat)}
            </>
          ) : newMatches.length === 0 && activeChats.length === 0 ? (
            <>
              <EmptyState
                text="No matches yet."
                animation={require('../assets/hearts.json')}
              />
              <TouchableOpacity onPress={() => navigation.navigate('GameWithBot')}>
                <Text
                  style={{
                    textAlign: 'center',
                    marginTop: 10,
                    color: theme.accent,
                  }}
                >
                  Play with an AI bot
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {newMatches.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>New Matches</Text>
                  <FlatList
                    data={newMatches}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNewMatch}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.newList}
                  />
                </>
              )}
              <Text style={styles.sectionTitle}>Active Chats</Text>
              <FlatList
                data={activeChats}
                keyExtractor={(item) => item.id}
                renderItem={renderChat}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                  <EmptyState
                    text="No chats yet."
                    image={require('../assets/logo.png')}
                  />
                }
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
              />
              {historyMatches.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Rematch History</Text>
                  {historyMatches.map((m) => renderHistoryItem(m))}
                </>
              )}
            </>
          )}
        </View>
      </ScreenContainer>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: 8,
    color: '#ff4081',
  },
  newList: {
    marginBottom: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  newMatch: {
    alignItems: 'center',
    marginRight: 12,
  },
  newAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6,
  },
  newName: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 72,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  avatarName: {
    fontSize: 12,
    marginTop: 4,
    maxWidth: 64,
    textAlign: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatPreview: {
    fontSize: 12,
    marginTop: 2,
  },
  playBtn: {
    backgroundColor: '#ff4081',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  playText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonText: {
    height: 10,
    borderRadius: 4,
  },
});

MatchesScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default MatchesScreen;
