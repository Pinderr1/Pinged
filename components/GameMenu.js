import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

export default function GameMenu({
  visible,
  bottom = 0,
  onCancel,
  onChange,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!visible) return null;
  return (
    <View style={[styles.menu, { bottom }]}>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.item}>Cancel Game</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onChange}>
        <Text style={styles.item}>Change Game</Text>
      </TouchableOpacity>
    </View>
  );
}

GameMenu.propTypes = {
  visible: PropTypes.bool,
  bottom: PropTypes.number,
  onCancel: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    menu: {
      position: 'absolute',
      right: 20,
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 8,
    },
    item: {
      color: '#fff',
      paddingVertical: 6,
    },
  });
