// screens/EmailLoginScreen.js
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { auth, db, firebase } from '../firebase';
import { snapshotExists } from '../utils/firestore';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import styles from '../styles';
import { useOnboarding } from '../contexts/OnboardingContext';

export default function EmailLoginScreen({ navigation }) {
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
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Failed to ensure user doc', e);
    }
  };


  const handleLogin = async () => {
    try {
      const userCred = await auth.signInWithEmailAndPassword(
        email,
        password
      );
      console.log('✅ Logged in:', userCred.user.uid);
      await ensureUserDoc(userCred.user);
      const snap = await db.collection('users').doc(userCred.user.uid).get();
      if (snapshotExists(snap) && snap.data().onboardingComplete) {
        markOnboarded();
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          'No Account Found',
          'Would you like to sign up with this email?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Up', onPress: () => navigation.navigate('Signup') },
          ]
        );
      } else {
        Alert.alert('Login Failed', error.message);
      }
    }
  };

  return (
    <GradientBackground>
      <SafeKeyboardView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <Text style={[styles.logoText, { color: '#fff' }]}>Log In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#ccc"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#ccc"
      />

      <GradientButton text="Log In" onPress={handleLogin} />

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={{ color: '#fff', marginTop: 10 }}>Need an account? Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: '#fff', marginTop: 10 }}>← Back</Text>
      </TouchableOpacity>
      </SafeKeyboardView>
    </GradientBackground>
  );
}
