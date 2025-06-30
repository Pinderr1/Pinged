import React from 'react';
import { TextInput } from 'react-native';
import PropTypes from 'prop-types';
import SafeKeyboardView from './SafeKeyboardView';
import GradientButton from './GradientButton';
import styles from '../styles';

export default function AuthForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  submitLabel,
  children,
}) {
  return (
    <SafeKeyboardView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#ccc"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#ccc"
      />
      <GradientButton text={submitLabel} onPress={onSubmit} />
      {children}
    </SafeKeyboardView>
  );
}

AuthForm.propTypes = {
  email: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired,
  children: PropTypes.node,
};
