import React, { useState } from 'react';
import { Text, TouchableOpacity, Alert } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import AuthForm from '../components/AuthForm';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { useOnboarding } from '../contexts/OnboardingContext';
import { snapshotExists } from '../utils/firestore';
import { isAllowedDomain } from '../utils/email';
import styles from '../styles';
import PropTypes from 'prop-types';

export default function EmailAuthScreen({ route, navigation }) {
  const mode = route.params?.mode || (route.name === 'Signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { markOnboarded } = useOnboarding();

  const ensureUserDoc = async (fbUser) => {
    try {
      const ref = db.collection('users').doc(fbUser.uid);
      const snap = await ref.get();
      if (!snapshotExists(snap)) {
        await ref.set({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || '',
          photoURL: fbUser.photoURL || '',
          onboardingComplete: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Failed to ensure user doc', e);
    }
  };

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(userCred.user);
      const snap = await db.collection('users').doc(userCred.user.uid).get();
      if (snapshotExists(snap) && snap.data().onboardingComplete) {
        markOnboarded();
      }
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
    if (!isAllowedDomain(email)) {
      Alert.alert('Invalid Email', 'Please use a supported email provider (e.g. gmail.com).');
      return;
    }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await db.collection('users').doc(userCred.user.uid).set({
        uid: userCred.user.uid,
        email: userCred.user.email,
        displayName: userCred.user.displayName || '',
        photoURL: userCred.user.photoURL || '',
        onboardingComplete: false,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Signup Successful', 'Your account has been created.');
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  const submitLabel = mode === 'signup' ? 'Sign Up' : 'Log In';
  const onSubmit = mode === 'signup' ? handleSignup : handleLogin;

  return (
    <GradientBackground>
      <Text style={[styles.logoText, { color: '#fff' }]}>
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
              <Text style={{ color: '#fff', marginTop: 10 }}>Need an account? Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: '#fff', marginTop: 10 }}>← Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text style={{ color: '#fff' }}>← Back to Login</Text>
          </TouchableOpacity>
        )}
      </AuthForm>
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
