import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useUser } from '../contexts/UserContext';

export default function DebugMenuScreen() {
  const { darkMode, toggleTheme, theme } = useTheme();
  const { devMode, toggleDevMode } = useDev();
  const { clearOnboarding } = useOnboarding();
  const { user } = useUser();

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
  };

  const styles = {
    content: { flexGrow: 1, justifyContent: 'center', width: '100%' },
    label: { color: theme.textSecondary, textAlign: 'center', marginBottom: 10 },
  };

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer style={{ flex: 1 }}>
        <Header />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.label]}>UID: {user?.uid || 'None'}</Text>
          <GradientButton
            text={`Toggle ${darkMode ? 'Light' : 'Dark'} Mode`}
            onPress={toggleTheme}
          />
          <GradientButton
            text={devMode ? 'Disable Dev Mode' : 'Enable Dev Mode'}
            onPress={toggleDevMode}
          />
          <GradientButton text="Skip Onboarding" onPress={clearOnboarding} />
          <GradientButton text="Clear AsyncStorage" onPress={clearStorage} />
        </ScrollView>
      </ScreenContainer>
    </GradientBackground>
  );
}
