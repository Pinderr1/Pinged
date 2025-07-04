import React from 'react';
import { Text, Linking, Platform } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import { useTheme } from '../contexts/ThemeContext';
import getStyles from '../styles';

export default function UpdateRequiredScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const handleUpdate = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://example.com/ios'
        : 'https://example.com/android';
    Linking.openURL(url).catch(() => {});
  };
  return (
    <GradientBackground style={styles.container}>
      <Text style={[styles.logoText, { color: '#fff' }]}>Pinged</Text>
      <Text
        style={{
          color: '#fff',
          marginVertical: 20,
          fontSize: 16,
          textAlign: 'center',
        }}
      >
        A new version of Pinged is required. Please update to continue.
      </Text>
      <GradientButton text="Update" onPress={handleUpdate} width={180} />
    </GradientBackground>
  );
}
