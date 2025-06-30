// screens/LoginScreen.js
import React, { useEffect } from 'react';
import { Image, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import GradientBackground from '../../components/GradientBackground';
import GradientButton from '../../components/GradientButton';
import getStyles from '../../styles';
import { useTheme } from '../../contexts/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import firebase from '../../firebase';
import { snapshotExists } from '../../utils/firestore';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useNavigation } from '@react-navigation/native';
import { useDev } from '../../contexts/DevContext';
import PropTypes from 'prop-types';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation();
  const { markOnboarded } = useOnboarding();
  const { toggleDevMode } = useDev();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'pinged' });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      firebase
        .auth()
        .signInWithCredential(credential)
        .then(async (res) => {
          console.log('✅ Google login success:', res.user.uid);
          const snap = await firebase
            .firestore()
            .collection('users')
            .doc(res.user.uid)
            .get();
          if (snapshotExists(snap) && snap.data().onboardingComplete) {
            markOnboarded();
          }
        })
        .catch((error) => {
          console.error('❌ Firebase SignIn Error', error);
          Toast.show({ type: 'error', text1: 'Login failed.' });
        });
    }
  }, [response]);

  const handleDevLogin = async () => {
    toggleDevMode();
    try {
      const cred = await firebase.auth().signInAnonymously();
      await firebase.firestore().collection('users').doc(cred.user.uid).set({
        uid: cred.user.uid,
        email: '',
        displayName: 'Dev Tester',
        photoURL: '',
        onboardingComplete: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn('Dev login failed', e);
    }
  };

  return (
    <GradientBackground>
      <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
      <Text style={[styles.logoText, { color: theme.text }]}>Pinged</Text>

      <GradientButton
        text="Sign in with Google"
        onPress={() => promptAsync({ useProxy: false, prompt: 'select_account' })}
      />

      <GradientButton
        text="Login with Email"
        onPress={() => navigation.navigate('EmailLogin')}
      />

        <GradientButton
          text="Sign Up"
          onPress={() => navigation.navigate('Signup')}
        />

        <GradientButton
          text="Dev Onboarding"
          onPress={handleDevLogin}
        />
      </GradientBackground>
    );
  }
LoginScreen.propTypes = {};
