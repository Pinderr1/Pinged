import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../components/ScreenContainer';
import GradientButton from '../components/GradientButton';
import GradientBackground from '../components/GradientBackground';
import getStyles from '../styles';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import firebase from '../firebase';
import PropTypes from 'prop-types';
import AvatarRing from '../components/AvatarRing';
import ProgressBar from '../components/ProgressBar';
import { getProfileCompletion } from '../utils/profile';

const SettingsScreen = ({ navigation }) => {
  const { darkMode, toggleTheme, theme } = useTheme();
  const styles = getStyles(theme);
  const { user } = useUser();
  const isPremium = !!user?.isPremium;
  const { devMode, toggleDevMode } = useDev();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleAdvanced = () => setShowAdvanced((prev) => !prev);

  const handleEditProfile = () => navigation.navigate('Profile', { editMode: true });
  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      // RootNavigator will detect the auth change and present the AuthStack
      // so no manual navigation reset is required here.
    } catch (e) {
      console.warn('Failed to sign out', e);
    }
  };
  const handleGoPremium = () => navigation.navigate('Premium', { context: 'paywall' });
  const completion = getProfileCompletion(user);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer style={styles.container}>
        <Header />

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={handleEditProfile} style={{ marginBottom: 6 }}>
          <AvatarRing source={user?.photos?.[0] || user?.photoURL} size={80} />
          <Ionicons
            name="pencil"
            size={20}
            color={theme.text}
            style={{ position: 'absolute', bottom: 0, right: 0 }}
          />
        </TouchableOpacity>
        <ProgressBar value={completion} max={100} />
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
          Profile {completion}% complete
        </Text>
      </View>

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

      {isPremium && (
        <GradientButton
          text="People Who Liked You"
          onPress={() => navigation.navigate('LikedYou')}
        />
      )}

      <GradientButton
        text="Pinged Platinum"
        onPress={() => navigation.navigate('Premium', { context: 'upgrade' })}
      />
      <GradientButton
        text="Get More Super Likes"
        onPress={() => navigation.navigate('Premium', { context: 'upgrade' })}
      />

      <GradientButton text="Edit Profile" onPress={handleEditProfile} />

      <GradientButton
        text={showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
        onPress={toggleAdvanced}
      />

      {showAdvanced && (
        <>
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
        </>
      )}
      </ScreenContainer>
    </GradientBackground>
  );
};

SettingsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default SettingsScreen;
