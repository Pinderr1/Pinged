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
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { avatarSource } from '../utils/avatar';
import styles from '../styles';
import { games } from '../games';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SyncedGame from '../components/SyncedGame';
import GameOverModal from '../components/GameOverModal';
import { useMatchmaking } from '../contexts/MatchmakingContext';

const GameLobbyScreen = ({ route, navigation }) => {
  const { darkMode } = useTheme();
  const { devMode } = useDev();
  const { recordGamePlayed } = useGameLimit();
  const { user } = useUser();
  const { game, opponent, status = 'waiting', inviteId } = route.params || {};
  const [inviteStatus, setInviteStatus] = useState(status);
  const [showGame, setShowGame] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [devPlayer, setDevPlayer] = useState('0');
  const [gameResult, setGameResult] = useState(null);
  const { sendGameInvite } = useMatchmaking();
  const GameComponent = game?.id ? games[game.id]?.Client : null;

  const isReady = devMode || inviteStatus === 'ready';

  useEffect(() => {
    if (!inviteId) return;
    const ref = doc(db, 'gameInvites', inviteId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setInviteStatus(snap.data().status);
      }
    });
    return unsub;
  }, [inviteId]);

  useEffect(() => {
    if (isReady && !showGame && countdown === null && !devMode) {
      setCountdown(3);
    }
  }, [isReady]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setShowGame(true);
      recordGamePlayed();
      if (inviteId) {
        updateDoc(doc(db, 'gameInvites', inviteId), {
          status: 'active',
          startedAt: serverTimestamp(),
        });
      }
    } else {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleGameEnd = (result) => {
    setGameResult(result);
  };

  const handleRematch = async () => {
    if (inviteId) {
      await updateDoc(doc(db, 'gameInvites', inviteId), {
        status: 'finished',
        endedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'gameSessions', inviteId), {
        archived: true,
        archivedAt: serverTimestamp(),
      });
    }

    const newId = await sendGameInvite(opponent.id, game.id);
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
            source={avatarSource(user?.photoURL)}
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
            source={avatarSource(opponent?.photo)}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: darkMode ? '#fff' : '#222' }}>
            {opponent?.name || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <Text style={{ textAlign: 'center', color: darkMode ? '#aaa' : '#666', marginBottom: 30 }}>
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
