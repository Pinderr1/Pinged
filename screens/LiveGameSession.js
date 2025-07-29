import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Easing,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../contexts/ThemeContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { HEADER_SPACING } from '../layout';
import { useUser } from '../contexts/UserContext';
import firebase from '../firebase';
import * as Haptics from 'expo-haptics';
import getGlobalStyles from '../styles';
import { games } from '../games';
import SyncedGame from '../components/SyncedGame';
import GameOverModal from '../components/GameOverModal';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { snapshotExists } from '../utils/firestore';
import Toast from 'react-native-toast-message';
import Loader from '../components/Loader';
import { useSound } from '../contexts/SoundContext';
import EmptyState from '../components/EmptyState';
import { logGameStats } from '../utils/gameStats';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import PlayerInfoBar from '../components/PlayerInfoBar';
import useUserProfile from '../hooks/useUserProfile';
import PropTypes from 'prop-types';
import { computeBadges } from '../utils/badges';

const LiveGameSession = ({ route, navigation }) => {
  const { darkMode, theme } = useTheme();
  const globalStyles = getGlobalStyles(theme);
  const local = createStyles(theme);
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { user, addGameXP } = useUser();
  const isPremiumUser = !!user?.isPremium;
  const requireCredits = useRequireGameCredits();
  const { sendGameInvite, cancelInvite } = useMatchmaking();

  const { game, opponent, status = 'waiting', inviteId } = route.params || {};

  const [inviteStatus, setInviteStatus] = useState(status);
  const [showGame, setShowGame] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const gameActive = showGame && !gameResult;
  const GameComponent = game?.id ? games[game.id]?.Client : null;
  const isReady = inviteStatus === 'ready';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const [showFallback, setShowFallback] = useState(false);
  const opponentProfile = useUserProfile(opponent?.id);

  const userBadges = computeBadges({
    xp: user?.xp,
    streak: user?.streak,
    badges: user?.badges || [],
    isPremium: user?.isPremium,
  });
  const oppBadges = computeBadges({
    xp: opponentProfile?.xp,
    streak: opponentProfile?.streak,
    badges: opponentProfile?.badges || [],
    isPremium: opponentProfile?.isPremium,
  });

  useEffect(() => {
    if (!inviteId || !user?.uid) return;
    const ref = firebase.firestore().collection('gameInvites').doc(inviteId);
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

  useEffect(() => {
    if (isReady && !showGame && countdown === null) {
      setCountdown(3);
    }
  }, [isReady]);

  useEffect(() => {
    if (countdown !== null) {
      scaleAnim.setValue(1.5);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [countdown]);

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: showGame ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [showGame, overlayOpacity]);

  useEffect(() => {
    if (showGame) return;
    if (inviteStatus === 'cancelled' || inviteStatus === 'declined') {
      setShowFallback(true);
    }
  }, [inviteStatus, showGame]);

  useEffect(() => {
    if (countdown === null) return;
    const handleStart = async () => {
      try {
        if (!requireCredits()) return;
        setShowGame(true);
        setCountdown(null);
        recordGamePlayed();
        if (opponent?.id && user?.uid) {
          const matchId = [user.uid, opponent.id].sort().join('_');
          const snap = await firebase
            .firestore()
            .collection('matches')
            .doc(matchId)
            .get();
          if (!snapshotExists(snap)) {
            console.warn('Match doc missing for session', matchId);
            Toast.show({ type: 'error', text1: 'Match not found' });
          }
        }
      } catch (e) {
        console.warn('Failed to start game', e);
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
    if (result) {
      addGameXP();
      if (inviteId) logGameStats(inviteId);
    }
    setGameResult(result);
  };

  const handleRematch = async () => {
    try {
      if (!requireCredits()) return;
      if (inviteId && user?.uid) {
        const ref = firebase.firestore().collection('gameInvites').doc(inviteId);
        const snap = await ref.get();
        const data = snap.data();
        if (snapshotExists(snap) && (data.from === user.uid || data.to === user.uid)) {
          await ref.update({
            status: 'finished',
            endedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          await firebase
            .firestore()
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
      navigation.replace('GameSession', {
        game,
        opponent,
        inviteId: newId,
        status: 'waiting',
      });
    } catch (e) {
      console.warn('Failed to start rematch', e);
    }
  };

  const [debouncedRematch, rematchWaiting] = useDebouncedCallback(handleRematch, 800);

  const handleCancel = async () => {
    try {
      if (inviteId) await cancelInvite(inviteId);
    } catch (e) {
      console.warn('Failed to cancel invite', e);
    }
    navigation.goBack();
  };

  if (!game || !opponent) {
    return (
      <GradientBackground style={globalStyles.swipeScreen}>
        <Header showLogoOnly />
        <Text style={{ marginTop: 80, color: theme.text }}>Invalid game data.</Text>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={globalStyles.swipeScreen}>
      <Header showLogoOnly />

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 10 }}>
        <PlayerInfoBar
          name="You"
          xp={user?.xp || 0}
          badges={userBadges}
          isPremium={user?.isPremium}
        />
        <PlayerInfoBar
          name={opponent.displayName}
          xp={opponentProfile?.xp || 0}
          badges={oppBadges}
          isPremium={opponentProfile?.isPremium}
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {GameComponent && gameActive && (
          <View style={{ alignItems: 'center' }}>
            <SyncedGame
              sessionId={inviteId}
              gameId={game.id}
              opponent={{ id: opponent.id, photo: opponent.photo, online: true }}
              onGameEnd={handleGameEnd}
            />
          </View>
        )}
        {!showGame && (
          <Animated.View style={[local.overlay, { opacity: overlayOpacity }]}>
            {countdown === null ? (
              showFallback ? (
                <>
                  <Text style={[local.waitText, { color: theme.text }]}>Game didn't start.</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('GameSession', { sessionType: 'bot' })}>
                    <Text style={{ color: theme.accent, marginTop: 10 }}>
                      Play with an AI bot instead
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCancel}>
                    <Text style={{ color: theme.accent, marginTop: 10 }}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[local.waitText, { color: theme.text }]}>Waiting for opponent...</Text>
                  <Loader size="small" style={{ marginTop: 20 }} />
                  <TouchableOpacity onPress={() => navigation.navigate('GameSession', { sessionType: 'bot' })}>
                    <Text style={{ color: theme.accent, marginTop: 10 }}>
                      Play with an AI bot instead
                    </Text>
                  </TouchableOpacity>
                </>
              )
            ) : (
              <Animated.Text style={[local.countText, { transform: [{ scale: scaleAnim }] }]}>{countdown}</Animated.Text>
            )}
          </Animated.View>
        )}
      </View>

      <GameOverModal
        visible={!!gameResult}
        winnerName={
          gameResult?.winner === '0'
            ? 'You'
            : gameResult?.winner === '1'
            ? opponent.displayName
            : null
        }
        winnerAvatar={
          gameResult?.winner === '0'
            ? user.photoURL
            : gameResult?.winner === '1'
            ? opponent.photo
            : null
        }
        winnerId={
          gameResult?.winner === '0'
            ? user.uid
            : gameResult?.winner === '1'
            ? opponent.id
            : null
        }
        onRematch={debouncedRematch}
        rematchDisabled={rematchWaiting}
        onExit={() => navigation.goBack()}
      />
    </GradientBackground>
  );
};

LiveGameSession.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func }).isRequired,
  route: PropTypes.object.isRequired,
};

const createStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0007',
    },
    countText: {
      fontSize: 80,
      color: '#fff',
      fontWeight: 'bold',
    },
    waitText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

export default LiveGameSession;
