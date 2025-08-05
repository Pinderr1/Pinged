// screens/LoginScreen.js
import React, { useEffect, useRef } from 'react';

import Toast from 'react-native-toast-message';
import GradientBackground from '../../components/GradientBackground';
import GradientButton from '../../components/GradientButton';
import { Animated, Easing, Image, Text } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import Header from '../../components/Header';
import { HEADER_SPACING } from '../../layout';
import getStyles from '../../styles';
import { useTheme } from '../../contexts/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import firebase from '../../firebase';
import { snapshotExists } from '../../utils/firestore';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useNavigation } from '@react-navigation/native';
import PropTypes from 'prop-types';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { markOnboarded } = useOnboarding();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'pinged' });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    let isMounted = true;
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      firebase
        .auth()
        .signInWithCredential(credential)
        .then(async (res) => {
          if (!isMounted) return;
          const snap = await firebase
            .firestore()
            .collection('users')
            .doc(res.user.uid)
            .get();
          if (snapshotExists(snap) && snap.data().onboardingCompleted) {
            markOnboarded();
          }
        })
        .catch((error) => {
          if (isMounted) {
            console.error('❌ Firebase SignIn Error', error);
            Toast.show({ type: 'error', text1: 'Login failed.' });
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [response]);


  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <GradientBackground>
      <Header showLogoOnly />
      <ScreenContainer
        scroll
        contentContainerStyle={[
          styles.container,
          { paddingTop: HEADER_SPACING, alignItems: 'center' },
        ]}
      >
        <Animated.View style={{ alignItems: 'center', opacity: anim, transform: [{ scale }] }}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
          <Text style={[styles.logoText, { color: theme.text }]}>Pinged</Text>
        </Animated.View>

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

      </ScreenContainer>
    </GradientBackground>
  );
  }
LoginScreen.propTypes = {};
