import React, { useEffect } from 'react';
import { View, Text, Switch, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useUser } from '../contexts/UserContext';
import getStyles from '../styles';
import { HEADER_SPACING } from '../layout';
import PropTypes from 'prop-types';

export default function DebugMenuScreen({ navigation }) {
  const { darkMode, toggleTheme, theme } = useTheme();
  const { devMode, toggleDevMode } = useDev();
  const { clearOnboarding } = useOnboarding();
  const { user } = useUser();
  const styles = getStyles(theme);

  useEffect(() => {
    if (!devMode) {
      navigation.goBack();
    }
  }, [devMode, navigation]);

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
  };

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header showLogoOnly />
      <ScreenContainer style={{ paddingTop: HEADER_SPACING }}>
      <Text style={[styles.logoText, { color: theme.text, marginBottom: 20 }]}>Debug Menu</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.settingText, { marginRight: 8 }]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={toggleTheme} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.settingText, { marginRight: 8 }]}>Dev Mode</Text>
          <Switch value={devMode} onValueChange={toggleDevMode} />
        </View>
        <View style={{ marginBottom: 20 }}>
          <Button title="Skip Onboarding" onPress={clearOnboarding} />
        </View>
        <View style={{ marginBottom: 20 }}>
          <Button title="Clear AsyncStorage" onPress={clearStorage} />
        </View>
      <Text style={[styles.settingText, { marginTop: 20 }]}>UID: {user?.uid || 'None'}</Text>
      </ScreenContainer>
    </GradientBackground>
  );
}

DebugMenuScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};
