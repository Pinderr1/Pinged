import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import { avatarSource } from '../utils/avatar';

export default function AvatarRing({
  source,
  size = 40,
  isMatch = false,
  isOnline = false,
  isPremium = false,
}) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPremium) {
      const loop = Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isPremium, shimmer]);

  useEffect(() => {
    if (isOnline) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.4,
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
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isOnline, pulse]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  const ringSize = size + 6;

  return (
    <View style={{ width: ringSize, height: ringSize }}>
      {isPremium ? (
        <View style={[styles.premiumRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}> 
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimmerTranslate }] }]}
          >
            <LinearGradient
              colors={['#ffd700', '#fff', '#ffd700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      ) : isMatch ? (
        <LinearGradient
          colors={[ '#ff0080', '#ff8c00' ]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
          }}
        />
      ) : null}
      <View style={{
        position: 'absolute',
        top: 3,
        left: 3,
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
      }}>
        <Image source={avatarSource(source)} style={{ width: size, height: size }} />
      </View>
      {isOnline && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#2ecc71',
            borderWidth: 1,
            borderColor: '#fff',
            transform: [{ scale: pulse }],
          }}
        />
      )}
    </View>
  );
}

AvatarRing.propTypes = {
  source: PropTypes.any,
  size: PropTypes.number,
  isMatch: PropTypes.bool,
  isOnline: PropTypes.bool,
  isPremium: PropTypes.bool,
};

const styles = StyleSheet.create({
  premiumRing: {
    overflow: 'hidden',
  },
});
