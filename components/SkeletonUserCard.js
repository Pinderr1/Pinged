import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function SkeletonUserCard() {
  const { theme, darkMode } = useTheme();
  const styles = getStyles(theme, darkMode);
  return (
    <View style={styles.card}>
      <View style={styles.image} />
      <View style={styles.info}>
        <View style={styles.name} />
        <View style={styles.bio} />
        <View style={[styles.bio, { width: '60%' }]} />
      </View>
    </View>
  );
}

const getStyles = (theme, darkMode) =>
  StyleSheet.create({
    card: {
      width: SCREEN_WIDTH * 0.9,
      height: CARD_HEIGHT,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: theme.card,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    image: {
      width: '100%',
      height: '75%',
      backgroundColor: darkMode ? '#333' : '#eee',
    },
    info: {
      padding: 15,
    },
    name: {
      width: '50%',
      height: 24,
      borderRadius: 12,
      backgroundColor: darkMode ? '#444' : '#ddd',
      marginBottom: 8,
    },
    bio: {
      width: '80%',
      height: 16,
      borderRadius: 8,
      backgroundColor: darkMode ? '#333' : '#eee',
      marginTop: 4,
    },
  });
