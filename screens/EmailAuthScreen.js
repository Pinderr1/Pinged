import React, { useState } from 'react';
import { Text, TouchableOpacity, Alert } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import AuthForm from '../components/AuthForm';
import ScreenContainer from '../components/ScreenContainer';
import SafeKeyboardView from '../components/SafeKeyboardView';
import Header from '../components/Header';
import { HEADER_SPACING } from '../layout';
import firebase from '../firebase';
import Toast from 'react-native-toast-message';
import getStyles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

export default function EmailAuthScreen({ route, navigation }) {
  const mode = route.params?.mode || (route.name === 'Signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { signUpWithEmail } = useAuth();

  const handleLogin = async () => {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert('No Account Found', 'Would you like to sign up with this email?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => navigation.navigate('Signup') },
        ]);
      } else {
        Alert.alert('Login Failed', error.message);
      }
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Enter both email and password.');
      return;
    }
    try {
      await signUpWithEmail(email, password);
      Toast.show({ type: 'success', text1: 'Signup successful' });
    } catch (error) {
      if (error.message === 'UNSUPPORTED_DOMAIN') {
        Toast.show({
          type: 'error',
          text1: 'Use Gmail, Outlook, Yahoo, or iCloud addresses.',
        });
      } else {
        Toast.show({ type: 'error', text1: 'Signup failed' });
      }
    }
  };

  const submitLabel = mode === 'signup' ? 'Sign Up' : 'Log In';
  const onSubmit = mode === 'signup' ? handleSignup : handleLogin;

  return (
    <GradientBackground>
      <Header showLogoOnly />
      <SafeKeyboardView style={{ flex: 1 }}>
        <ScreenContainer scroll contentContainerStyle={[styles.container, { paddingTop: HEADER_SPACING }]}>
        <Text style={[styles.logoText, { color: theme.text }]}>
          {mode === 'signup' ? 'Create Account' : 'Log In'}
        </Text>
        <AuthForm
          email={email}
          onEmailChange={setEmail}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
      >
        {mode === 'login' ? (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={{ color: theme.text, marginTop: 10 }}>Need an account? Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: theme.text, marginTop: 10 }}>← Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text style={{ color: theme.text }}>← Back to Login</Text>
          </TouchableOpacity>
        )}
        </AuthForm>
      </ScreenContainer>
      </SafeKeyboardView>
    </GradientBackground>
  );
}

EmailAuthScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      mode: PropTypes.string,
    }),
    name: PropTypes.string,
  }).isRequired,
};
