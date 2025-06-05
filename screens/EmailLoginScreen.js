// screens/EmailLoginScreen.js
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import styles from '../styles';

export default function EmailLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in:', userCred.user.uid);
      navigation.replace('Onboarding');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // If user doesn't exist, create account
        try {
          const newUser = await createUserWithEmailAndPassword(auth, email, password);
          console.log('Signed up:', newUser.user.uid);
          navigation.replace('Onboarding');
        } catch (signupError) {
          Alert.alert('Signup Failed', signupError.message);
        }
      } else {
        Alert.alert('Login Failed', error.message);
      }
    }
  };

  return (
    <GradientBackground>
      <Text style={[styles.logoText, { color: '#fff' }]}>Sign In with Email</Text>
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
      <GradientButton text="Log In / Sign Up" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: '#fff', marginTop: 10 }}>← Back to Login</Text>
      </TouchableOpacity>
    </GradientBackground>
  );
}
