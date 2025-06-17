// screens/LoginScreen.js
import React, { useEffect } from 'react';
import { Image, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import styles from '../styles';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../contexts/OnboardingContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation();
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
      console.error('Onboarding check failed:', e);
      navigation.replace('Onboarding');
    }
  };

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((res) => {
          console.log('✅ Google login success:', res.user.uid);
          checkOnboarding(res.user.uid);
        })
        .catch((error) => {
          console.error('❌ Firebase SignIn Error', error);
          Toast.show({ type: 'error', text1: 'Login failed.' });
        });
    }
  }, [response]);

  return (
    <GradientBackground>
      <Image source={require('../assets/logo.png')} style={styles.logoImage} />
      <Text style={[styles.logoText, { color: '#fff' }]}>Pinged</Text>

      <GradientButton
        text="Sign in with Google"
        onPress={() => promptAsync({ prompt: 'select_account' })}
      />

      <GradientButton
        text="Login with Email"
        onPress={() => navigation.navigate('EmailLogin')}
      />

      <GradientButton
        text="Sign Up"
        onPress={() => navigation.navigate('Signup')}
      />
    </GradientBackground>
  );
}
