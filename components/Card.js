import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Card({ children, style, Component = View, ...rest }) {
  const { theme } = useTheme();
  return (
    <Component style={[styles.card, { backgroundColor: theme.card }, style]} {...rest}>
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
});
