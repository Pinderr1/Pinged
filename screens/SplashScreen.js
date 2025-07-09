// screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../contexts/ThemeContext';
import getStyles from '../styles';
import { textStyles } from '../textStyles';
import PropTypes from 'prop-types';

const splashDuration = 2000;

const useFadeIn = (duration = 1000) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, []);
  return fadeAnim;
};

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useFadeIn();
  const showEgg = useRef(Math.random() < 0.02).current;
  const { darkMode, theme } = useTheme();
  const styles = getStyles(theme);
  const colors = theme.gradient;

  useEffect(() => {
    const timeout = setTimeout(onFinish, splashDuration);
    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <GradientBackground colors={colors} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Image source={require('../assets/logo.png')} style={styles.logoImage} />
          <Text style={[styles.logoText, { color: '#fff' }]}>Pinged</Text>
          <Text style={[textStyles.subtitle, { color: '#fff' }]}>Find your next ping...</Text>
          {showEgg && (
            <Text style={[textStyles.label, { color: '#fff', marginTop: 4 }]}>
              Lucky day! Try the secret mini-game: Strip RPS 😉
            </Text>
          )}
          <LottieView
            source={
              showEgg
                ? require('../assets/confetti.json')
                : require('../assets/hearts.json')
            }
            autoPlay
            loop
            style={{ width: 200, height: 200, position: 'absolute', bottom: -20 }}
          />
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
}

SplashScreen.propTypes = {
  onFinish: PropTypes.func.isRequired,
};
