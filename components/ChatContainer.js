import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

export default function ChatContainer({ children, style }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

ChatContainer.propTypes = {
  children: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
