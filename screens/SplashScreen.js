// screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StatusBar, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import getStyles from '../styles';
import { HEADER_SPACING } from '../layout';
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
  const { darkMode, theme } = useTheme();
  const styles = getStyles(theme);
  const colors = [theme.gradientStart, theme.gradientEnd];

  useEffect(() => {
    const timeout = setTimeout(onFinish, splashDuration);
    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <GradientBackground colors={colors} style={[styles.container, { paddingTop: HEADER_SPACING }]}>
      <Header />
      <StatusBar barStyle="light-content" />
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        <Text style={[styles.logoText, { color: '#fff' }]}>Pinged</Text>
        <Text style={{ color: '#fff', fontSize: 16 }}>Find your next ping...</Text>
        <LottieView
          source={require('../assets/hearts.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200, position: 'absolute', bottom: -20 }}
        />
      </Animated.View>
    </GradientBackground>
  );
}

SplashScreen.propTypes = {
  onFinish: PropTypes.func.isRequired,
};
