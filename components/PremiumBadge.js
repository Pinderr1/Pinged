import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function PremiumBadge({ visible }) {
  const { darkMode } = useTheme();
  if (!visible) return null;

  return (
    <Text style={[styles.badge, darkMode && styles.badgeDark]}>★ Premium</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    color: '#fff',
    backgroundColor: '#d81b60',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    overflow: 'hidden',
  },
  badgeDark: {
    backgroundColor: '#d81b60',
  },
});
