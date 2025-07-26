import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GradientButton from './GradientButton';
import SkeletonUserCard from './SkeletonUserCard';
import EmptyState from './EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING } from '../layout';
import PropTypes from 'prop-types';

export default function FilterPanel({ loading, onBoostPress, onChangeFilters, show }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!show) return null;
  if (loading) {
    return <SkeletonUserCard />;
  }
  return (
    <View style={styles.noMoreWrapper}>
      <EmptyState text="No more swipes" animation={require('../assets/hearts.json')} />
      <GradientButton text="Boost" width={180} onPress={onBoostPress} style={{ marginTop: 20 }} />
      <TouchableOpacity onPress={onChangeFilters} style={{ marginTop: 12 }}>
        <Text style={styles.changeFiltersText}>Change Filters</Text>
      </TouchableOpacity>
    </View>
  );
}

FilterPanel.propTypes = {
  loading: PropTypes.bool,
  onBoostPress: PropTypes.func.isRequired,
  onChangeFilters: PropTypes.func.isRequired,
  show: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    noMoreWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
    },
    changeFiltersText: {
      color: theme.accent,
      textDecorationLine: 'underline',
      fontSize: 16,
      marginTop: 4,
    },
  });
