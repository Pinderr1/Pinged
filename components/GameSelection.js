import React from 'react';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { allGames } from '../data/games';
import { BADGE_LIST } from '../data/badges';

export default function GameSelection({ selected = [], onChange }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const toggle = (title) => {
    if (!onChange) return;
    if (selected.includes(title)) {
      onChange(selected.filter((t) => t !== title));
    } else {
      onChange([...selected, title]);
    }
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {allGames.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.option}
            onPress={() => toggle(game.title)}
          >
            <Ionicons
              name={selected.includes(game.title) ? 'checkbox' : 'square-outline'}
              size={24}
              color={theme.accent}
            />
            <View style={styles.infoWrap}>
              <Text style={styles.title}>{game.title}</Text>
              <Text style={styles.category}>{game.category}</Text>
            </View>
            <View style={styles.iconWrap}>{game.icon}</View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.badgesRow} pointerEvents="none">
        {BADGE_LIST.map((b) => (
          <Ionicons key={b.id} name={b.icon} size={20} color={theme.textSecondary} style={styles.badge} />
        ))}
      </View>
    </>
  );
}

GameSelection.propTypes = {
  selected: PropTypes.array,
  onChange: PropTypes.func,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { maxHeight: 250, marginBottom: 10 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoWrap: { flex: 1, marginLeft: 8 },
    title: { color: theme.text, fontSize: 16 },
    category: { color: theme.textSecondary, fontSize: 12 },
    iconWrap: { marginLeft: 8 },
    badgesRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
    badge: { marginHorizontal: 4 },
  });
