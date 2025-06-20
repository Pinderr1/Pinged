// screens/SignUpScreen.js
import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import SafeKeyboardView from '../components/SafeKeyboardView';
import styles from '../styles';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Enter both email and password.');
      return;
    }
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      console.log('✅ Signed up:', userCred.user.uid);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: userCred.user.email,
        displayName: userCred.user.displayName || '',
        photoURL: userCred.user.photoURL || '',
        onboardingComplete: false,
        isPremium: false,
        dailyPlayCount: 0,
        lastGamePlayedAt: null,
        createdAt: serverTimestamp(),
      });
      navigation.replace('Onboarding');
    } catch (error) {
      console.error(error);
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <GradientBackground>
      <SafeKeyboardView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}
      >
        <Text style={[styles.logoText, { color: '#fff', marginBottom: 30 }]}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <GradientButton text="Sign Up" onPress={handleSignup} />

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#fff' }}>← Back to Login</Text>
        </TouchableOpacity>
      </SafeKeyboardView>
    </GradientBackground>
  );
}
