import React from 'react';
import { Text, Linking, Platform } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import getStyles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { APPLE_STORE_URL, GOOGLE_PLAY_STORE_URL } from '../config';

export default function UpdateScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const openStore = () => {
    const url = Platform.OS === 'ios' ? APPLE_STORE_URL : GOOGLE_PLAY_STORE_URL;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <GradientBackground>
      <Header showLogoOnly />
      <ScreenContainer style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[styles.logoText, { marginBottom: 20 }]}>Update Required</Text>
        <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 20 }}>
          A new version of Pinged is available. Please update to continue.
        </Text>
        <GradientButton text="Update" onPress={openStore} width={200} />
      </ScreenContainer>
    </GradientBackground>
  );
}
