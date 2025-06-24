// screens/LoginScreen.js
import React, { useEffect } from 'react';
import { Image, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import styles from '../styles';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, firebase } from '../firebase';
import { useNavigation } from '@react-navigation/native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      auth
        .signInWithCredential(credential)
        .then((res) => {
          console.log('✅ Google login success:', res.user.uid);
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
