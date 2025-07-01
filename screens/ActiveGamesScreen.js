import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useGameSessions } from '../contexts/GameSessionContext';
import { useChats } from '../contexts/ChatContext';
import { useUser } from '../contexts/UserContext';
import { games } from '../games';
import firebase from '../firebase';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { HEADER_SPACING } from '../layout';

const ActiveGamesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { sessions } = useGameSessions();
  const { matches } = useChats();
  const { user } = useUser();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setList(sessions);
    setLoading(false);
  }, [sessions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const snap = await firebase
        .firestore()
        .collection('gameSessions')
        .where('players', 'array-contains', user.uid)
        .get();
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setList(data);
    } catch (e) {
      console.warn('Failed to refresh sessions', e);
    }
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    const otherId = item.players.find((p) => p !== user.uid);
    const match = matches.find((m) => m.otherUserId === otherId);
    const opponentName = match?.displayName || 'Opponent';
    const title = games[item.gameId]?.meta?.title || 'Game';
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        onPress={() =>
          navigation.navigate('GameSession', {
            sessionId: item.id,
            game: { id: item.gameId, title },
            opponent: {
              id: otherId,
              displayName: opponentName,
              photo: match?.image,
            },
          })
        }
      >
        <Text style={[styles.gameText, { color: theme.text }]}>{title}</Text>
        <Text style={{ color: theme.textSecondary }}>{opponentName}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <View style={{ flex: 1, paddingTop: HEADER_SPACING }}>
          {loading ? (
            <View style={styles.loader}>
              <Loader />
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
              ListEmptyComponent={
                <EmptyState
                  text="No active games."
                  image={require('../assets/logo.png')}
                />
              }
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          )}
        </View>
      </GradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  gameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActiveGamesScreen;
