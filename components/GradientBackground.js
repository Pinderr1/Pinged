// components/GradientBackground.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';


export default function GradientBackground({ children, style, colors }) {
  const { theme } = useTheme();
  const gradientColors = colors || [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient colors={gradientColors} style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}
