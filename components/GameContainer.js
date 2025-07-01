import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from './GradientBackground';
import PlayerInfoBar from './PlayerInfoBar';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';

export default function GameContainer({
  children,
  player,
  opponent,
  active = true,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [showChat, setShowChat] = useState(false);
  const scale = useRef(new Animated.Value(active ? 1 : 0.8)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: active ? 1 : 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [active, scale]);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <View style={styles.header}>
        <PlayerInfoBar {...player} />
        <PlayerInfoBar {...opponent} />
      </View>
      <Animated.View style={[styles.boardSlot, { transform: [{ scale }] }]}> 
        {children}
      </Animated.View>
      <TouchableOpacity
        style={styles.chatToggle}
        onPress={() => setShowChat((v) => !v)}
      >
        <Ionicons
          name={showChat ? 'chatbubble' : 'chatbubble-outline'}
          size={24}
          color={theme.accent}
        />
      </TouchableOpacity>
      {showChat && (
        <View style={styles.chatBox}>
          <Text style={{ color: theme.text }}>Chat coming soon...</Text>
        </View>
      )}
    </GradientBackground>
  );
}

GameContainer.propTypes = {
  children: PropTypes.node.isRequired,
  player: PropTypes.object,
  opponent: PropTypes.object,
  active: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginTop: 10,
    },
    boardSlot: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatToggle: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 8,
    },
    chatBox: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      alignItems: 'center',
    },
  });
