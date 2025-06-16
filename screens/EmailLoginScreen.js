// screens/EmailLoginScreen.js
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import styles from '../styles';
import { useOnboarding } from '../contexts/OnboardingContext';
import log from '../utils/logger';

export default function EmailLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { markOnboarded } = useOnboarding();

  const checkOnboarding = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists() && snap.data().onboardingComplete) {
        markOnboarded();
        navigation.replace('Main');
      } else {
        navigation.replace('Onboarding');
      }
    } catch (e) {
      navigation.replace('Onboarding');
    }
  };

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      log('✅ Logged in:', userCred.user.uid);
      await checkOnboarding(userCred.user.uid);
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
    </GradientBackground>
  );
}
