// components/GradientBackground.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import styles from '../styles';

export default function GradientBackground({ children, colors, style }) {
  const { theme } = useTheme();
  const gradientColors = colors || [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient colors={gradientColors} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
}
