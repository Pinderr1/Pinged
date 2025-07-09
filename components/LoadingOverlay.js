import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLoading } from '../contexts/LoadingContext';
import { useTheme } from '../contexts/ThemeContext';
import Loader from './Loader';

export default function LoadingOverlay() {
  const { visible } = useLoading();
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
      />
      <Loader />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
});
