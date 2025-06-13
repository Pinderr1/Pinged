import React from 'react';
import { KeyboardAvoidingView, View, Platform } from 'react-native';

export default function SafeKeyboardView({ children, style, ...props }) {
  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" style={style} {...props}>
        {children}
      </KeyboardAvoidingView>
    );
  }
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
}
