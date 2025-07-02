import { KeyboardAvoidingView, Platform } from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import { HEADER_SPACING } from '../layout';

export default function SafeKeyboardView({ children, style }) {
  return (
    <KeyboardAvoidingView
      style={style}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? HEADER_SPACING : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

SafeKeyboardView.propTypes = {
  children: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
