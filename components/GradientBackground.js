// components/GradientBackground.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import styles from '../styles';

export default function GradientBackground({ children }) {
  const { darkMode } = useTheme();
  const colors = darkMode ? ['#1e1e1e', '#121212'] : ['#FF75B5', '#FF9A75'];

  return (
    <LinearGradient colors={colors} style={styles.container}>
      {children}
    </LinearGradient>
  );
}
