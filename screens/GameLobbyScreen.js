import React, { useState, useEffect } from 'react';
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
import { useUser } from '../contexts/UserContext';
import { db, firebase } from '../firebase';
import { avatarSource } from '../utils/avatar';
import styles from '../styles';
import { games } from '../games';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SyncedGame from '../components/SyncedGame';
import GameOverModal from '../components/GameOverModal';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { snapshotExists } from '../utils/firestore';
import Toast from 'react-native-toast-message';

const GameLobbyScreen = ({ route, navigation }) => {
  const { darkMode, theme } = useTheme();
  const { devMode } = useDev();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { user, addGameXP } = useUser();
  const isPremiumUser = !!user?.isPremium;
  const { sendGameInvite } = useMatchmaking();

  const { game, opponent, status = 'waiting', inviteId } = route.params || {};

  const [inviteStatus, setInviteStatus] = useState(status);
  const [showGame, setShowGame] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [devPlayer, setDevPlayer] = useState('0');
  const [gameResult, setGameResult] = useState(null);

  const GameComponent = game?.id ? games[game.id]?.Client : null;
  const isReady = devMode || inviteStatus === 'ready';

  // Listen for Firestore invite status
  useEffect(() => {
    if (!inviteId || !user?.uid) return;
    const ref = db.collection('gameInvites').doc(inviteId);
    const unsub = ref.onSnapshot((snap) => {
      if (snapshotExists(snap)) {
        const data = snap.data();
        if (data.from === user.uid || data.to === user.uid) {
          setInviteStatus(data.status);
        }
      }
    });
    return unsub;
  }, [inviteId, user?.uid]);

  // Trigger countdown if ready
  useEffect(() => {
    if (isReady && !showGame && countdown === null && !devMode) {
      setCountdown(3);
    }
  }, [isReady]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    const handleStart = async () => {
      if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
        navigation.navigate('PremiumPaywall');
        return;
      }
      setShowGame(true);
      recordGamePlayed();
      if (inviteId && user?.uid) {
        const ref = db.collection('gameInvites').doc(inviteId);
        const snap = await ref.get();
        const data = snap.data();
        if (snapshotExists(snap) && (data.from === user.uid || data.to === user.uid)) {
          ref.update({
            status: 'active',
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    };

    if (countdown <= 0) {
      handleStart();
    } else {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown, inviteId, user?.uid]);

  const handleGameEnd = (result) => {
    if (result) addGameXP();
    setGameResult(result);
  };

  const handleRematch = async () => {
    if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
      navigation.navigate('PremiumPaywall');
      return;
    }
    if (inviteId && user?.uid) {
      const ref = db.collection('gameInvites').doc(inviteId);
        const snap = await ref.get();
        const data = snap.data();
        if (snapshotExists(snap) && (data.from === user.uid || data.to === user.uid)) {
          await ref.update({
            status: 'finished',
            endedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          await db
          .collection('gameSessions')
          .doc(inviteId)
          .update({
            archived: true,
            archivedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      }
    }

    const newId = await sendGameInvite(opponent.id, game.id);
    Toast.show({ type: 'success', text1: 'Invite sent!' });
    setGameResult(null);
    navigation.replace('GameLobby', {
      game,
      opponent,
      inviteId: newId,
      status: devMode ? 'ready' : 'waiting',
    });
  };

  if (!game || !opponent) {
    return (
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.swipeScreen}
      >
        <Header showLogoOnly />
        <Text style={{ marginTop: 80, color: theme.text }}>
          Invalid game data.
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.swipeScreen}
    >
      <Header showLogoOnly />

      {/* Game Info */}
      <View style={{ alignItems: 'center', marginTop: 70, marginBottom: 20 }}>
        <MaterialCommunityIcons name="controller-classic" size={34} color={theme.text} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
          {game.title}
        </Text>
      </View>

      {/* Players Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 30 }}>
        {/* You */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={avatarSource(user?.photoURL)}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
            You
          </Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d81b60' }}>VS</Text>

        {/* Opponent */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={avatarSource(opponent?.photo)}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
            {opponent?.name || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <Text style={{ textAlign: 'center', color: theme.textSecondary, marginBottom: 30 }}>
        {countdown !== null
          ? `Starting in ${countdown}...`
          : isReady
          ? 'Both players are ready!'
          : 'Waiting for opponent to accept...'}
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
          disabled={!isReady || countdown !== null}
          onPress={() => {
            if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
              navigation.navigate('PremiumPaywall');
              return;
            }
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

      {/* Game Component */}
      {showGame && GameComponent && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {devMode ? (
            <>
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
              <GameComponent playerID={devPlayer} matchID="dev" />
            </>
          ) : (
            <SyncedGame
              sessionId={inviteId}
              gameId={game.id}
              opponentId={opponent.id}
              onGameEnd={handleGameEnd}
            />
          )}
        </View>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        visible={!!gameResult}
        winnerName={
          gameResult?.winner === '0'
            ? 'You'
            : gameResult?.winner === '1'
            ? opponent.name
            : null
        }
        onRematch={handleRematch}
        onChat={() =>
          navigation.navigate('Chat', {
            user: { id: opponent.id, name: opponent.name, image: opponent.photo },
            gameId: game.id,
          })
        }
      />
    </LinearGradient>
  );
};

export default GameLobbyScreen;
