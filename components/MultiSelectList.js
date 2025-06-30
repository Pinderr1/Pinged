import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

export default function MultiSelectList({ options = [], selected = [], onChange, theme }) {
  const toggle = (val) => {
    if (!onChange) return;
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
    Haptics.selectionAsync().catch(() => {});
  };

  const styles = getStyles(theme);
  return (
    <ScrollView style={styles.container}>
      {options.map((opt) => (
        <TouchableOpacity key={opt.value} style={styles.option} onPress={() => toggle(opt.value)}>
          <MaterialCommunityIcons
            name={selected.includes(opt.value) ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={theme?.accent}
          />
          <Text style={styles.label}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

MultiSelectList.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.any.isRequired, label: PropTypes.string.isRequired })
  ),
  selected: PropTypes.array,
  onChange: PropTypes.func,
  theme: PropTypes.object,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { maxHeight: 250 },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    label: { marginLeft: 8, color: theme?.text || '#000', fontSize: 16 },
  });
