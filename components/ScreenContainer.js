import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

export default function ScreenContainer({
  children,
  style,
  scroll = false,
  contentContainerStyle,
  ...rest
}) {
  return (
    <SafeAreaView style={[styles.container, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

ScreenContainer.propTypes = {
  children: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  scroll: PropTypes.bool,
  contentContainerStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  content: {
    flexGrow: 1,
    paddingVertical: 20,
  },
});
