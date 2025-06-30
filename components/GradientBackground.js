// components/GradientBackground.js
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';
import getStyles from '../styles';

export default function GradientBackground({ children, colors, style }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const gradientColors = colors || [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient colors={gradientColors} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
}

GradientBackground.propTypes = {
  children: PropTypes.node,
  colors: PropTypes.arrayOf(PropTypes.string),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
