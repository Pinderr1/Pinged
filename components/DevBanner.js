import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useDev } from '../contexts/DevContext';

export default function DevBanner() {
  const { devMode } = useDev();
  if (!devMode) return null;
  return (
    <View style={styles.banner} pointerEvents="none">
      <Text style={styles.text}>DEV MODE</Text>
    </View>
  );
}

DevBanner.propTypes = {};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: '#b91c1c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
