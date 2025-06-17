// components/GradientBackground.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import styles from '../styles';

export default function GradientBackground({ children }) {
  const { theme } = useTheme();
  const colors = [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient colors={colors} style={styles.container}>
      {children}
    </LinearGradient>
  );
}
