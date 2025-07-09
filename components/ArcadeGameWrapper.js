import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';
import { avatarSource } from '../utils/avatar';
import CountdownRing from './CountdownRing';

export default function ArcadeGameWrapper({
  children,
  title,
  icon,
  player,
  opponent,
  turn,
  playerName = 'You',
  opponentName = 'Opponent',
  timerProgress,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glow]);

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.playersRow}>
        <View style={styles.playerBox}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarSource(player?.photo)} style={styles.avatar} />
            {turn === '0' && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.avatarGlow,
                  { transform: [{ scale: glowScale }], opacity: glowOpacity },
                ]}
              />
            )}
            {turn === '0' && timerProgress != null && (
              <CountdownRing
                progress={timerProgress}
                style={styles.countdownRing}
              />
            )}
            <View
              style={[styles.dot, { backgroundColor: player?.online ? '#2ecc71' : '#999' }]}
            />
          </View>
          <Animated.Text
            style={[
              styles.nameText,
              { color: theme.text, transform: [{ scale: turn === '0' ? pulse : 1 }] },
            ]}
          >
            {playerName}
          </Animated.Text>
        </View>
        <Animated.Text
          style={[
            styles.turnText,
            { color: theme.text, transform: [{ scale: turn === '0' ? pulse : 1 }] },
          ]}
        >
          {turn === '0' ? 'Your turn' : ' '}
        </Animated.Text>
        <View style={styles.playerBox}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarSource(opponent?.photo)} style={styles.avatar} />
            {turn === '1' && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.avatarGlow,
                  { transform: [{ scale: glowScale }], opacity: glowOpacity },
                ]}
              />
            )}
            {turn === '1' && timerProgress != null && (
              <CountdownRing
                progress={timerProgress}
                style={styles.countdownRing}
              />
            )}
            <View
              style={[styles.dot, { backgroundColor: opponent?.online ? '#2ecc71' : '#999' }]}
            />
          </View>
          <Animated.Text
            style={[
              styles.nameText,
              { color: theme.text, transform: [{ scale: turn === '1' ? pulse : 1 }] },
            ]}
          >
            {opponentName}
          </Animated.Text>
        </View>
      </View>
      <View style={styles.card}>{children}</View>
    </LinearGradient>
  );
}

ArcadeGameWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  icon: PropTypes.node,
  player: PropTypes.object,
  opponent: PropTypes.object,
  turn: PropTypes.string,
  playerName: PropTypes.string,
  opponentName: PropTypes.string,
  timerProgress: PropTypes.number,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    icon: { marginRight: 8 },
    title: { fontSize: 24, fontWeight: 'bold' },
    playersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 20,
    },
    playerBox: { alignItems: 'center', justifyContent: 'center' },
    avatarWrapper: { justifyContent: 'center', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarGlow: {
      position: 'absolute',
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#ffb6c1',
    },
    countdownRing: {
      position: 'absolute',
      top: -6,
      left: -6,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      position: 'absolute',
      bottom: 2,
      right: 2,
      borderWidth: 1,
      borderColor: '#fff',
    },
    nameText: { fontWeight: '600', marginTop: 4, fontSize: 12 },
    turnText: { fontWeight: 'bold' },
    card: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 2,
      borderColor: theme.accent,
      shadowColor: theme.accent,
      shadowOpacity: 0.6,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 10,
    },
  });
