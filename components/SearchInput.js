import React from 'react';
import { View, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

export default function SearchInput({ search, setSearch }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 6,
        backgroundColor: theme.card,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        elevation: 2,
      }}
    >
      <TextInput
        placeholder="Search games..."
        placeholderTextColor={theme.textSecondary}
        value={search}
        onChangeText={setSearch}
        style={{ fontSize: 14, color: theme.text, paddingVertical: 3 }}
      />
    </View>
  );
}

SearchInput.propTypes = {
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
};
