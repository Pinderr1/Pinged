import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import GradientBackground from './GradientBackground';
import Loader from './Loader';

export default function LoadingOverlay({ visible }) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade">
      <GradientBackground style={styles.overlay}>
        <Loader />
      </GradientBackground>
    </Modal>
  );
}

LoadingOverlay.propTypes = {
  visible: PropTypes.bool,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
