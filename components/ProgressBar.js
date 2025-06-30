import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';

export default function ProgressBar({ label, value = 0, max = 100, color }) {
  const { theme } = useTheme();
  const pct = Math.min(value / max, 1);

  const widthAnim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [pct, widthAnim]);

  const barStyle = {
    height: '100%',
    width: widthAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
    backgroundColor: color || theme.accent,
  };

  return (
    <View style={{ marginVertical: 4 }}>
      {label && (
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>{label}</Text>
      )}
      <View
        style={{
          height: 10,
          width: '100%',
          backgroundColor: '#eee',
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        <Animated.View style={barStyle} />
      </View>
    </View>
  );
}

ProgressBar.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  max: PropTypes.number,
  color: PropTypes.string,
};
