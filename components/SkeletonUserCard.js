import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { shadowStyle } from '../styles/common';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;

function SkeletonUserCard() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={[styles.card, shadowStyle]}>
      <View style={styles.image} />
      <View style={styles.info}>
        <View style={styles.name} />
        <View style={styles.bio} />
        <View style={[styles.bio, { width: '60%' }]} />
      </View>
    </View>
  );
}

SkeletonUserCard.propTypes = {};

export default SkeletonUserCard;

const getStyles = (theme) =>
  StyleSheet.create({
    card: {
      width: SCREEN_WIDTH * 0.9,
      height: CARD_HEIGHT,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: theme.card,
    },
    image: {
      width: '100%',
      height: '75%',
      backgroundColor: theme.textSecondary,
      opacity: 0.3,
    },
    info: {
      padding: 15,
    },
    name: {
      width: '50%',
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.textSecondary,
      opacity: 0.3,
      marginBottom: 8,
    },
    bio: {
      width: '80%',
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.textSecondary,
      opacity: 0.3,
      marginTop: 4,
    },
  });
