import { KeyboardAvoidingView, Platform } from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';

export default function SafeKeyboardView({ children, style, offset }) {
  const verticalOffset =
    offset !== undefined
      ? offset
      : Platform.OS === 'ios'
      ? 60
      : 0;

  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={verticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

SafeKeyboardView.propTypes = {
  children: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  offset: PropTypes.number,
};
