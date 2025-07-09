import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { allGames } from '../data/games';
import { BADGE_LIST } from '../data/badges';

export default function GameSelectList({ selected = [], onChange, theme, showPreviewBadges = false }) {
  const toggle = (title) => {
    if (!onChange) return;
    if (selected.includes(title)) {
      onChange(selected.filter((v) => v !== title));
    } else {
      onChange([...selected, title]);
    }
  };

  const styles = getStyles(theme);

  return (
    <>
      <ScrollView style={styles.container}>
        {allGames.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={styles.option}
            onPress={() => toggle(g.title)}
          >
            {g.icon}
            <View style={styles.info}>
              <Text style={styles.label}>{g.title}</Text>
              <Text style={styles.category}>{g.category}</Text>
            </View>
            <MaterialCommunityIcons
              name={selected.includes(g.title) ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={theme?.accent}
              style={styles.checkbox}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {showPreviewBadges && (
        <View style={styles.badgeRow}>
          {BADGE_LIST.map((b) => (
            <Ionicons
              key={b.id}
              name={b.icon}
              size={20}
              color={theme?.accent}
              style={styles.badgeIcon}
            />
          ))}
        </View>
      )}
    </>
  );
}

GameSelectList.propTypes = {
  selected: PropTypes.array,
  onChange: PropTypes.func,
  theme: PropTypes.object,
  showPreviewBadges: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { maxHeight: 250 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    info: { flex: 1, marginLeft: 8 },
    label: { color: theme?.text || '#000', fontSize: 16 },
    category: { color: theme?.textSecondary || '#666', fontSize: 12 },
    checkbox: { marginLeft: 8 },
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
    },
    badgeIcon: { marginHorizontal: 4 },
  });
