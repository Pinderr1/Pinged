import React from 'react';
import { Text, View } from 'react-native';
import GradientButton from '../components/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { auth } from '../firebase';

const SettingsScreen = ({ navigation }) => {
  const { darkMode, toggleTheme, theme } = useTheme();
  const { user } = useUser();
  const isPremium = !!user?.isPremium;
  const { devMode, toggleDevMode } = useDev();

  const handleEditProfile = () => navigation.navigate('Profile', { editMode: true });
  const handleLogout = async () => {
    await auth.signOut();
    // RootNavigator will detect the auth change and present the AuthStack
    // so no manual navigation reset is required here.
  };
  const handleGoPremium = () => navigation.navigate('Premium', { context: 'paywall' });

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.container}
    >
      <Header />

      <Text style={[styles.logoText, { color: theme.text, marginBottom: 10 }]}>
        Settings
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={[styles.settingText, { color: theme.textSecondary }]}>
          Account: {user?.email || 'Unknown'}
        </Text>
        <Text style={[styles.settingText, { color: theme.textSecondary }]}>
          Status: {isPremium ? '🌟 Premium Member' : 'Free Member'}
        </Text>
      </View>

      {!isPremium && (
        <GradientButton
          text="Go Premium"
          onPress={handleGoPremium}
          icon={<Text style={{ fontSize: 16 }}>💎</Text>}
        />
      )}

      <GradientButton text="Edit Profile" onPress={handleEditProfile} />

      <GradientButton
        text={`Toggle ${darkMode ? 'Light' : 'Dark'} Mode`}
        onPress={toggleTheme}
      />

      <GradientButton
        text="View My Stats"
        onPress={() => navigation.navigate('Stats')}
      />

      <GradientButton
        text={devMode ? 'Disable Dev Mode' : 'Enable Dev Mode'}
        onPress={toggleDevMode}
      />

      <GradientButton text="Log Out" onPress={handleLogout} />
    </LinearGradient>
  );
};

export default SettingsScreen;
