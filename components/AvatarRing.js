import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { avatarSource } from '../utils/avatar';

export default function AvatarRing({
  source,
  size = 56,
  isMatch = false,
  isOnline = false,
  isPremium = false,
  style,
}) {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPremium) {
      const loop = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isPremium, shimmerAnim]);

  useEffect(() => {
    if (isOnline) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isOnline, pulseAnim]);

  const ringSize = size + 8;
  const ringStyle = {
    width: ringSize,
    height: ringSize,
    borderRadius: ringSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  };
  const imageStyle = { width: size, height: size, borderRadius: size / 2 };

  const onlineSize = size / 4;
  const dotScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const dotOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  return (
    <View style={[style, { width: ringSize, height: ringSize }]}>
      {isPremium ? (
        <View style={ringStyle}>
          <View style={[StyleSheet.absoluteFill, styles.overflow, { borderRadius: ringSize / 2 }]}>
            <Animated.View
              style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimmerTranslate }] }]}
            >
              <LinearGradient
                colors={[ '#f5c242', '#ffd700', '#f5c242' ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Image source={avatarSource(source)} style={imageStyle} />
        </View>
      ) : isMatch ? (
        <LinearGradient colors={theme.gradient} style={ringStyle}>
          <Image source={avatarSource(source)} style={imageStyle} />
        </LinearGradient>
      ) : (
        <View style={ringStyle}>
          <Image source={avatarSource(source)} style={imageStyle} />
        </View>
      )}
      {isOnline && (
        <Animated.View
          style={[
            styles.dot,
            {
              width: onlineSize,
              height: onlineSize,
              borderRadius: onlineSize / 2,
              transform: [{ scale: dotScale }],
              opacity: dotOpacity,
            },
          ]}
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
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#2ecc71',
    borderWidth: 1,
    borderColor: '#fff',
  },
  overflow: { overflow: 'hidden' },
});
