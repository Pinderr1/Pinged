import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { avatarSource } from '../utils/avatar';

export default function PlayerTurnIndicator({ name, avatar, active, countdown }) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    if (active) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [active, glowAnim]);

  const scale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const opacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] });

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Image source={avatarSource(avatar)} style={styles.avatar} />
        <Animated.View style={[styles.glow, { transform: [{ scale }], opacity }]} />
        {countdown != null && (
          <View style={styles.ring} pointerEvents="none" />
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

PlayerTurnIndicator.propTypes = {
  name: PropTypes.string.isRequired,
  avatar: PropTypes.any,
  active: PropTypes.bool,
  countdown: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffb6c1',
    borderRadius: 25,
  },
  ring: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#ff9eb7',
  },
  name: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
