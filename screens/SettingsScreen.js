import React, { useState } from 'react';
import { Text, View, TextInput, Switch } from 'react-native';
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
import RNPickerSelect from 'react-native-picker-select';
import { useFilters } from '../contexts/FilterContext';
import Toast from 'react-native-toast-message';

const SettingsScreen = ({ navigation }) => {
  const { darkMode, toggleTheme, theme } = useTheme();
  const styles = getStyles(theme);
  const { user, updateUser } = useUser();
  const isPremium = !!user?.isPremium;
  const { devMode, toggleDevMode } = useDev();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [visibility, setVisibility] = useState(user?.visibility || 'standard');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(
    user?.discoveryEnabled !== false
  );
  const [messagePermission, setMessagePermission] = useState(
    user?.messagePermission || 'everyone'
  );
  const {
    location: filterLocation,
    ageRange,
    gender,
    verifiedOnly,
    setLocationFilter,
    setAgeRangeFilter,
    setGenderFilter,
    setVerifiedFilter,
  } = useFilters();

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

  const saveUserSetting = async (updates) => {
    if (!user?.uid) return;
    updateUser(updates);
    try {
      await firebase.firestore().collection('users').doc(user.uid).set(updates, { merge: true });
      Toast.show({ type: 'success', text1: 'Settings updated' });
    } catch (e) {
      console.warn('Failed to update settings', e);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

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

      {isPremium && (
        <>
          <GradientButton
            text={showDiscovery ? 'Hide Who You See' : 'Who You See'}
            onPress={() => setShowDiscovery((p) => !p)}
          />
          {showDiscovery && (
            <View style={{ width: '100%' }}>
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={filterLocation}
                onChangeText={(v) => {
                  setLocationFilter(v);
                  saveUserSetting({ seeLocation: v });
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 4 }]}
                  placeholder="Min Age"
                  value={String(ageRange[0])}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    const range = [parseInt(val, 10) || 18, ageRange[1]];
                    setAgeRangeFilter(range);
                    saveUserSetting({ seeAgeRange: range });
                  }}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 4 }]}
                  placeholder="Max Age"
                  value={String(ageRange[1])}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    const range = [ageRange[0], parseInt(val, 10) || 99];
                    setAgeRangeFilter(range);
                    saveUserSetting({ seeAgeRange: range });
                  }}
                />
              </View>
              <RNPickerSelect
                onValueChange={(val) => {
                  setGenderFilter(val);
                  saveUserSetting({ seeGender: val });
                }}
                value={gender}
                placeholder={{ label: 'Gender preference', value: '' }}
                useNativeAndroidPickerStyle={false}
                style={{ inputIOS: styles.input, inputAndroid: styles.input }}
                items={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.settingText, { marginRight: 8 }]}>Verified Only</Text>
                <Switch
                  value={verifiedOnly}
                  onValueChange={(v) => {
                    setVerifiedFilter(v);
                    saveUserSetting({ seeVerifiedOnly: v });
                  }}
                />
              </View>
            </View>
          )}
        </>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.settingText, { marginRight: 8 }]}>Discovery</Text>
        <Switch
          value={discoveryEnabled}
          onValueChange={(v) => {
            setDiscoveryEnabled(v);
            saveUserSetting({ discoveryEnabled: v });
          }}
        />
      </View>

      <RNPickerSelect
        onValueChange={(val) => {
          setVisibility(val);
          saveUserSetting({ visibility: val });
        }}
        value={visibility}
        placeholder={{ label: 'Visibility', value: null }}
        useNativeAndroidPickerStyle={false}
        style={{ inputIOS: styles.input, inputAndroid: styles.input }}
        items={isPremium ? [
            { label: 'Standard', value: 'standard' },
            { label: 'Incognito', value: 'incognito' },
          ] : [{ label: 'Standard', value: 'standard' }]}
      />

      <RNPickerSelect
        onValueChange={(val) => {
          setMessagePermission(val);
          saveUserSetting({ messagePermission: val });
        }}
        value={messagePermission}
        placeholder={{ label: 'Who can message me', value: null }}
        useNativeAndroidPickerStyle={false}
        style={{ inputIOS: styles.input, inputAndroid: styles.input }}
        items={[
          { label: 'Everyone', value: 'everyone' },
          { label: 'Only Verified', value: 'verified' },
          { label: 'Profile 100%', value: 'profile100' },
        ]}
      />

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
