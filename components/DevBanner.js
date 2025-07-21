import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { useDev } from '../contexts/DevContext';
let DevPanel;
if (__DEV__) {
  DevPanel = require('./DevPanel').default;
}

export default function DevBanner() {
  const { devMode } = useDev();
  const [showPanel, setShowPanel] = useState(false);
  if (!devMode) return null;
  return (
    <>
      <TouchableOpacity
        style={styles.banner}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setShowPanel(true);
        }}
      >
        <Text style={styles.text}>DEV MODE</Text>
      </TouchableOpacity>
      {__DEV__ && (
        <DevPanel visible={showPanel} onClose={() => setShowPanel(false)} />
      )}
    </>
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
