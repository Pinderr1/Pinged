import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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
        <TouchableOpacity style={[styles.emailBtn, { backgroundColor: '#d81b60' }]} onPress={handleGoPremium}>
          <Text style={styles.btnText}>Go Premium</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.emailBtn} onPress={handleEditProfile}>
        <Text style={styles.btnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBtn, { backgroundColor: '#666' }]}
        onPress={toggleTheme}
      >
        <Text style={styles.navBtnText}>
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBtn, { backgroundColor: '#d81b60' }]}
        onPress={() => navigation.navigate('Stats')}
      >
        <Text style={styles.navBtnText}>View My Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBtn, { backgroundColor: '#e11d48' }]}
        onPress={toggleDevMode}
      >
        <Text style={styles.navBtnText}>
          {devMode ? 'Disable Dev Mode' : 'Enable Dev Mode'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navBtn, { backgroundColor: '#999' }]}
        onPress={handleLogout}
      >
        <Text style={styles.navBtnText}>Log Out</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default SettingsScreen;
