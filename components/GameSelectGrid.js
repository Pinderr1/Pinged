import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { BADGE_LIST } from '../utils/badges';

export default function GameSelectGrid({ games = [], selected = [], onChange }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const toggle = (val) => {
    if (!onChange) return;
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.badgesRow}>
        {BADGE_LIST.map((badge) => (
          <Ionicons
            key={badge.id}
            name={badge.icon}
            size={20}
            color={theme.accent}
            style={styles.badgeIcon}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => toggle(game.title)}
            style={styles.item}
          >
            <View>{game.icon}</View>
            <Text style={styles.title}>{game.title}</Text>
            <Text style={styles.category}>{game.category}</Text>
            {selected.includes(game.title) && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.accent}
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

GameSelectGrid.propTypes = {
  games: PropTypes.array,
  selected: PropTypes.array,
  onChange: PropTypes.func,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { maxHeight: 300 },
    content: { paddingBottom: 12 },
    badgesRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 8,
    },
    badgeIcon: { marginHorizontal: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    item: {
      width: '30%',
      margin: 4,
      alignItems: 'center',
      position: 'relative',
      paddingVertical: 8,
    },
    title: { fontSize: 12, color: theme.text, textAlign: 'center' },
    category: { fontSize: 10, color: theme.textSecondary },
    checkIcon: { position: 'absolute', top: 2, right: 2 },
  });
