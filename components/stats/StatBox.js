import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

const StatBox = ({ loading, styles, children }) => (
  <View style={styles.statBox}>
    {loading ? (
      <>
        <View style={styles.skeletonLabel} />
        <View style={styles.skeletonValue} />
      </>
    ) : (
      children
    )}
  </View>
);

StatBox.propTypes = {
  loading: PropTypes.bool,
  styles: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export default StatBox;
