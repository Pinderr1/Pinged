import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import GradientBackground from './GradientBackground';
import PlayerInfoBar from './PlayerInfoBar';
import { useTheme } from '../contexts/ThemeContext';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function GameContainer({
  children,
  player = {},
  opponent = {},
  onToggleChat,
  onClose,
  visible = true,
  showHeader = true,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  return (
    <GradientBackground style={styles.container}>
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={22} color={theme.text} />
        </TouchableOpacity>
      )}
      {showHeader && (
        <View style={styles.header}>
          <PlayerInfoBar
            name={player.name || 'You'}
            xp={player.xp}
            badges={player.badges}
            isPremium={player.isPremium}
          />
          {onToggleChat && (
            <TouchableOpacity style={styles.chatToggle} onPress={onToggleChat}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={theme.text}
              />
            </TouchableOpacity>
          )}
          <PlayerInfoBar
            name={opponent.name || 'Opponent'}
            xp={opponent.xp}
            badges={opponent.badges}
            isPremium={opponent.isPremium}
          />
        </View>
      )}
      <AnimatedView
        style={[styles.boardSlot, { opacity: anim, transform: [{ scale: anim }] }]}
      >
        {children}
      </AnimatedView>
    </GradientBackground>
  );
}

GameContainer.propTypes = {
  children: PropTypes.node,
  player: PropTypes.object,
  opponent: PropTypes.object,
  onToggleChat: PropTypes.func,
  onClose: PropTypes.func,
  visible: PropTypes.bool,
  showHeader: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 10,
    },
    chatToggle: { paddingHorizontal: 8 },
    boardSlot: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
    },
    closeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 4,
      zIndex: 2,
    },
  });
