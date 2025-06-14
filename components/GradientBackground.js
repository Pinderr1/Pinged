// components/GradientBackground.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import styles from '../styles';

export default function GradientBackground({ children }) {
  const { darkMode } = useTheme();
  const colors = darkMode ? ['#2c2c2c', '#1b1b1b'] : ['#FF75B5', '#FF9A75'];

  return (
    <LinearGradient colors={colors} style={styles.container}>
      {children}
    </LinearGradient>
  );
}
