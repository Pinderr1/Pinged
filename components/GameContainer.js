import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import PropTypes from 'prop-types';
import GradientBackground from './GradientBackground';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING } from '../layout';

export default function GameContainer({
  children,
  player1,
  player2,
  visible = true,
  onToggleChat,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const fade = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(visible ? 1 : 0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: visible ? 1 : 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fade, scale]);

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          {player1?.avatar && (
            <Image source={{ uri: player1.avatar }} style={styles.avatar} />
          )}
          <Text style={styles.name}>{player1?.name || 'You'}</Text>
        </View>
        <View style={styles.playerInfo}>
          {player2?.avatar && (
            <Image source={{ uri: player2.avatar }} style={styles.avatar} />
          )}
          <Text style={styles.name}>{player2?.name || 'Opponent'}</Text>
        </View>
      </View>
      <Animated.View style={[styles.boardWrapper, { opacity: fade, transform: [{ scale }] }]}>
        {children}
      </Animated.View>
      {onToggleChat && (
        <TouchableOpacity style={styles.chatBtn} onPress={onToggleChat}>
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
      )}
    </GradientBackground>
  );
}

GameContainer.propTypes = {
  children: PropTypes.node.isRequired,
  player1: PropTypes.shape({ name: PropTypes.string, avatar: PropTypes.string }),
  player2: PropTypes.shape({ name: PropTypes.string, avatar: PropTypes.string }),
  visible: PropTypes.bool,
  onToggleChat: PropTypes.func,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: HEADER_SPACING,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    header: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    playerInfo: {
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginBottom: 4,
    },
    name: {
      color: theme.text,
      fontWeight: 'bold',
    },
    boardWrapper: {
      width: '90%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatBtn: {
      position: 'absolute',
      right: 20,
      bottom: 30,
      backgroundColor: theme.accent,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    chatText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });
