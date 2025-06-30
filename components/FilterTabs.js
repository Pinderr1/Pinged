import React from 'react';
import { View, TouchableOpacity, Text, Keyboard } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

export default function FilterTabs({ filter, setFilter }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 6 }}>
      {['All', 'Free', 'Premium', 'Favorites'].map((label) => (
        <TouchableOpacity
          key={label}
          onPress={() => {
            setFilter(label);
            Keyboard.dismiss();
          }}
          style={{
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 16,
            backgroundColor: filter === label ? theme.accent : '#eee',
            marginHorizontal: 3,
          }}
        >
          <Text
            style={{
              color: filter === label ? '#fff' : '#444',
              fontWeight: '600',
              fontSize: 12,
            }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

FilterTabs.propTypes = {
  filter: PropTypes.string.isRequired,
  setFilter: PropTypes.func.isRequired,
};
