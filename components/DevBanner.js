import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { useDev } from '../contexts/DevContext';
import DevPanel from './DevPanel';
import { triggerLightHaptic } from '../utils/haptics';

export default function DevBanner() {
  const { devMode } = useDev();
  const [showPanel, setShowPanel] = useState(false);
  if (!devMode) return null;
  return (
    <>
      <TouchableOpacity
        style={styles.banner}
        onPress={() => {
          triggerLightHaptic();
          setShowPanel(true);
        }}
      >
        <Text style={styles.text}>DEV MODE</Text>
      </TouchableOpacity>
      <DevPanel visible={showPanel} onClose={() => setShowPanel(false)} />
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
