import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';
import { avatarSource } from '../utils/avatar';

export default function ArcadeGameWrapper({
  children,
  title,
  icon,
  player,
  opponent,
  turn,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 500, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, easing: Easing.ease, useNativeDriver: true })
      ])
    ).start();
  }, [pulse]);

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.playersRow}>
        <View style={styles.playerBox}>
          <Image source={avatarSource(player?.photo)} style={styles.avatar} />
          <View
            style={[styles.dot, { backgroundColor: player?.online ? '#2ecc71' : '#999' }]}
          />
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
          <Image source={avatarSource(opponent?.photo)} style={styles.avatar} />
          <View
            style={[styles.dot, { backgroundColor: opponent?.online ? '#2ecc71' : '#999' }]}
          />
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
    avatar: { width: 40, height: 40, borderRadius: 20 },
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
