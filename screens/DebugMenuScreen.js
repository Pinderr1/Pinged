import React from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import GradientButton from '../components/GradientButton';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useUser } from '../contexts/UserContext';

export default function DebugMenuScreen({ navigation }) {
  const { darkMode, toggleTheme, theme } = useTheme();
  const { devMode, toggleDevMode } = useDev();
  const { markOnboarded } = useOnboarding();
  const { user } = useUser();

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
  };

  if (!devMode) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <ScreenContainer contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.text }}>Dev mode required</Text>
        </ScreenContainer>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <ScreenContainer contentContainerStyle={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.text }}>
          Debug Menu
        </Text>
        <GradientButton text={`Toggle ${darkMode ? 'Light' : 'Dark'} Mode`} onPress={toggleTheme} />
        <GradientButton text={devMode ? 'Disable Dev Mode' : 'Enable Dev Mode'} onPress={toggleDevMode} />
        <GradientButton text="Skip Onboarding" onPress={markOnboarded} />
        <GradientButton text="Clear AsyncStorage" onPress={clearStorage} />
        <Text style={{ marginTop: 20, color: theme.text }}>UID: {user?.uid || 'Unknown'}</Text>
      </ScreenContainer>
    </GradientBackground>
  );
}

DebugMenuScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func }),
};
