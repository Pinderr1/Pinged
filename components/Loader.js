import React from 'react';
import LottieView from 'lottie-react-native';

export default function Loader({ size = 'large', style }) {
  const dimension = size === 'small' ? 40 : 80;
  return (
    <LottieView
      source={require('../assets/chess-loader.json')}
      autoPlay
      loop
      style={[{ width: dimension, height: dimension }, style]}
    />
  );
}
