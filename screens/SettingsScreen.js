import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const SettingsScreen = ({ navigation }) => {
  const { darkMode, toggleTheme, theme } = useTheme();
  const styles = getStyles(theme);
  const { user } = useUser();
  const isPremium = !!user?.isPremium;
  const { devMode, toggleDevMode } = useDev();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allowDMs, setAllowDMs] = useState(true);
  const [swipeSurge, setSwipeSurge] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showDistanceKm, setShowDistanceKm] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([
      'allowDMs',
      'swipeSurge',
      'notificationsEnabled',
      'showDistanceKm',
    ])
      .then((res) => {
        const map = Object.fromEntries(res);
        setAllowDMs(map.allowDMs !== 'false');
        setSwipeSurge(map.swipeSurge === 'true');
        setNotificationsEnabled(map.notificationsEnabled !== 'false');
        setShowDistanceKm(map.showDistanceKm === 'true');
      })
      .catch((e) => console.warn('Failed to load settings', e));
  }, []);

  const persist = (key, val) =>
    AsyncStorage.setItem(key, val.toString()).catch((e) =>
      console.warn('Failed to persist setting', e)
    );

  const toggleAllowDMs = () => {
    const next = !allowDMs;
    setAllowDMs(next);
    persist('allowDMs', next);
  };
  const toggleSwipeSurge = () => {
    const next = !swipeSurge;
    setSwipeSurge(next);
    persist('swipeSurge', next);
  };
  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    persist('notificationsEnabled', next);
  };
  const toggleDistanceUnits = () => {
    const next = !showDistanceKm;
    setShowDistanceKm(next);
    persist('showDistanceKm', next);
  };

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

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer style={styles.container}>
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

      {isPremium && (
        <GradientButton
          text="People Who Liked You"
          onPress={() => navigation.navigate('LikedYou')}
        />
      )}

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
            text={allowDMs ? 'Disable DMs' : 'Allow DMs'}
            onPress={toggleAllowDMs}
          />

          <GradientButton
            text={swipeSurge ? 'Disable Swipe Surge' : 'Enable Swipe Surge'}
            onPress={toggleSwipeSurge}
          />

          <GradientButton
            text={notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
            onPress={toggleNotifications}
          />

          <GradientButton
            text={`Show Distance in ${showDistanceKm ? 'Miles' : 'Kilometers'}`}
            onPress={toggleDistanceUnits}
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

          <GradientButton
            text="Manage Payment Method"
            onPress={() => console.log('manage payment')}
          />
          <GradientButton
            text="Manage Google Play Subscriptions"
            onPress={() => console.log('manage subscriptions')}
          />
          <GradientButton
            text="Restore Purchases"
            onPress={() => console.log('restore purchases')}
          />

          <GradientButton
            text="Contact Us"
            onPress={() => navigation.navigate('ContactUs')}
          />
          <GradientButton
            text="Help & Support"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <GradientButton
            text="Community Guidelines"
            onPress={() => navigation.navigate('Guidelines')}
          />
          <GradientButton
            text="Privacy"
            onPress={() => navigation.navigate('Privacy')}
          />
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
