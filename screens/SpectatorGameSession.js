import React, { useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, Animated, StyleSheet } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import ScreenContainer from '../components/ScreenContainer';
import SyncedGame from '../components/SyncedGame';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING } from '../layout';
import useGameSession from '../hooks/useGameSession';
import PropTypes from 'prop-types';

function SpectatorGameSession({ route }) {
  const { theme } = useTheme();
  const styles = getSpectatorStyles(theme);
  const anim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef();
  const { sessionId, game, players = [] } = route.params || {};
  const { moveHistory, ctx, loading } = useGameSession(
    sessionId,
    game?.id,
    '',
    true
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [moveHistory]);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header showLogoOnly />
      <ScreenContainer style={{ paddingTop: HEADER_SPACING }}>
        {loading && (
          <Animated.Text style={[styles.waiting, { opacity: anim }]}>Waiting for Players...</Animated.Text>
        )}
        <View style={styles.playerRow}>
          {players.map((p) => (
            <View key={p.id} style={styles.player}>
              <Image
                source={p.photo ? { uri: p.photo } : require('../assets/logo.png')}
                style={styles.avatar}
              />
              <Text style={styles.playerName}>{p.displayName}</Text>
            </View>
          ))}
        </View>
        {!loading && (
          <View style={{ flex: 1, alignItems: 'center', marginBottom: 12 }}>
            <SyncedGame
              sessionId={sessionId}
              gameId={game?.id}
              opponent={players[1]}
              onGameEnd={() => {}}
              allowSpectate
            />
          </View>
        )}
        <View style={styles.logBox}>
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
            {moveHistory.map((m, idx) => (
              <Text key={idx} style={styles.logText}>
                Player {Number(m.player) + 1}: {m.action}
              </Text>
            ))}
          </ScrollView>
        </View>
      </ScreenContainer>
    </GradientBackground>
  );
}

const getSpectatorStyles = (theme) =>
  StyleSheet.create({
    waiting: {
      textAlign: 'center',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 12,
    },
    playerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 12,
    },
    player: { alignItems: 'center', marginHorizontal: 8 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginBottom: 4,
      borderWidth: 2,
      borderColor: '#9146FF',
    },
    playerName: { color: theme.text, fontSize: 12 },
    logBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#9146FF',
      borderRadius: 8,
      padding: 8,
      backgroundColor: '#0007',
    },
    logText: { color: '#fff', fontSize: 14, marginBottom: 2 },
});

SpectatorGameSession.propTypes = { route: PropTypes.object.isRequired };
export default SpectatorGameSession;
