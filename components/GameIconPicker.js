import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import CategoryChips from './CategoryChips';

export default function GameIconPicker({ games, selected = [], onChange }) {
  const categories = Array.from(new Set(games.map((g) => g.category)));
  const [category, setCategory] = useState('All');
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const filtered = category === 'All' ? games : games.filter((g) => g.category === category);

  const toggle = (id) => {
    if (!onChange) return;
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <View>
      <CategoryChips categories={['All', ...categories]} category={category} setCategory={setCategory} />
      <FlatList
        data={filtered}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, selected.includes(item.id) && styles.selected]}
            onPress={() => toggle(item.id)}
          >
            {item.icon}
            <Text style={styles.label}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

GameIconPicker.propTypes = {
  games: PropTypes.array.isRequired,
  selected: PropTypes.array,
  onChange: PropTypes.func,
};

const getStyles = (theme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '30%',
      margin: '1%',
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.card,
    },
    selected: { borderWidth: 2, borderColor: theme.accent },
    label: { color: theme.text, fontSize: 12, marginTop: 4, textAlign: 'center' },
  });
