import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import ScreenContainer from '../components/ScreenContainer';
import SafeKeyboardView from '../components/SafeKeyboardView';
import GradientButton from '../components/GradientButton';
import GradientBackground from '../components/GradientBackground';
import getStyles from '../styles';
import Header from '../components/Header';
import { useTheme, COLOR_THEMES } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebase from '../firebase';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';
import { useFilters } from '../contexts/FilterContext';
import Toast from 'react-native-toast-message';
import { HEADER_SPACING, SPACING } from '../layout';
import { CARD_STYLE } from '../components/Card';
import { textStyles } from '../textStyles';

const SettingsScreen = ({ navigation }) => {
  const { darkMode, toggleTheme, theme } = useTheme();
  const styles = getStyles(theme);
  const { user, updateUser } = useUser();
  const isPremium = !!user?.isPremium;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [visibility, setVisibility] = useState(user?.visibility || 'standard');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(
    user?.discoveryEnabled !== false
  );
  const [messagePermission, setMessagePermission] = useState(
    user?.messagePermission || 'everyone'
  );
  const [allowDMs, setAllowDMs] = useState(user?.allowDMs !== false);
  const [swipeSurge, setSwipeSurge] = useState(!!user?.swipeSurge);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled !== false
  );
  const [distanceUnit, setDistanceUnit] = useState(user?.distanceUnit || 'mi');
  const [colorTheme, setColorTheme] = useState(user?.colorTheme || 'pinkOrange');
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

  const handleSelectTheme = (id) => {
    setColorTheme(id);
    saveUserSetting({ colorTheme: id });
  };

  const handleEditProfile = () => navigation.navigate('EditProfile');
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

  const handleViewLikedYou = () => {
    if (isPremium) {
      navigation.navigate('LikedYou');
    } else {
      navigation.navigate('PremiumPaywall');
    }
  };

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

  const local = getLocalStyles(theme);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <SafeKeyboardView style={{ flex: 1 }}>
        <ScreenContainer
          scroll
          contentContainerStyle={[
            styles.container,
            { paddingTop: HEADER_SPACING, paddingHorizontal: SPACING.LG },
          ]}
        >
        <Header />

        <Text
          style={[styles.logoText, { color: theme.text, marginBottom: SPACING.LG }]}
        >
          Settings
        </Text>

        <View style={local.sectionCard}>
          <Text style={local.sectionTitle}>Account</Text>
          <Text style={[styles.settingText, { color: theme.textSecondary }]}>
            Account: {user?.email || 'Unknown'}
          </Text>
          <Text style={[styles.settingText, { color: theme.textSecondary }]}>
            Status: {isPremium ? '🌟 Premium Member' : 'Free Member'}
          </Text>
          {!isPremium && (
            <GradientButton
              text="Go Premium"
              onPress={handleGoPremium}
              icon={<Text style={{ fontSize: 16 }}>💎</Text>}
            />
          )}
          <GradientButton
            text="People Who Liked You"
            onPress={handleViewLikedYou}
          />
          <GradientButton text="Edit Profile" onPress={handleEditProfile} />
          <GradientButton
            text="Blocked Users"
            onPress={() => navigation.navigate('BlockedUsers')}
          />
        </View>

        <View style={local.sectionCard}>
          <Text style={local.sectionTitle}>Appearance</Text>
          <Text style={styles.settingText}>Pick a color theme</Text>
          <View style={{ flexDirection: 'row', marginBottom: SPACING.MD }}>
            {COLOR_THEMES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleSelectTheme(t.id)}
                style={{ marginRight: SPACING.SM }}
              >
                <LinearGradient
                  colors={[t.gradientStart, t.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: t.id === colorTheme ? 3 : 1,
                    borderColor: t.id === colorTheme ? '#fff' : '#ccc',
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={local.sectionCard}>
          <Text style={local.sectionTitle}>Discovery & Privacy</Text>
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

          <View style={local.switchRow}>
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
              if (val === 'incognito' && !isPremium) {
                navigation.navigate('PremiumPaywall');
                return;
              }
              setVisibility(val);
              saveUserSetting({ visibility: val });
            }}
            value={visibility}
            placeholder={{ label: 'Visibility', value: null }}
            useNativeAndroidPickerStyle={false}
            style={{ inputIOS: styles.input, inputAndroid: styles.input }}
            items={[
              { label: 'Standard', value: 'standard' },
              { label: 'Incognito', value: 'incognito' },
            ]}
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

          <View style={local.switchRow}>
            <Text style={[styles.settingText, { marginRight: 8 }]}>Allow DMs</Text>
            <Switch
              value={allowDMs}
              onValueChange={(v) => {
                setAllowDMs(v);
                saveUserSetting({ allowDMs: v });
              }}
            />
          </View>

          <View style={local.switchRow}>
            <Text style={[styles.settingText, { marginRight: 8 }]}>Swipe Surge</Text>
            <Switch
              value={swipeSurge}
              onValueChange={(v) => {
                setSwipeSurge(v);
                saveUserSetting({ swipeSurge: v });
              }}
            />
          </View>

          <View style={local.switchRow}>
            <Text style={[styles.settingText, { marginRight: 8 }]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => {
                setNotificationsEnabled(v);
                saveUserSetting({ notificationsEnabled: v });
              }}
            />
          </View>

          <RNPickerSelect
            onValueChange={(val) => {
              setDistanceUnit(val);
              saveUserSetting({ distanceUnit: val });
            }}
            value={distanceUnit}
            placeholder={{ label: 'Distance Unit', value: null }}
            useNativeAndroidPickerStyle={false}
            style={{ inputIOS: styles.input, inputAndroid: styles.input }}
            items={[
              { label: 'Miles', value: 'mi' },
              { label: 'Kilometers', value: 'km' },
            ]}
          />
        </View>

        <View style={local.sectionCard}>
          <Text style={local.sectionTitle}>Payment</Text>
          <GradientButton
            text="Manage Payment Method"
            onPress={() =>
              WebBrowser.openBrowserAsync('https://example.com/payments')
            }
          />
          <GradientButton
            text="Manage Google Play Subscriptions"
            onPress={() =>
              WebBrowser.openBrowserAsync(
                'https://play.google.com/store/account/subscriptions'
              )
            }
          />
          <GradientButton
            text="Restore Purchases"
            onPress={() =>
              WebBrowser.openBrowserAsync('https://example.com/restore')
            }
          />
        </View>

        <View style={local.sectionCard}>
          <Text style={local.sectionTitle}>Support</Text>
          <GradientButton
            text="Contact Us"
            onPress={() =>
              WebBrowser.openBrowserAsync('https://example.com/contact')
            }
          />
          <GradientButton
            text="Help & Support"
            onPress={() =>
              WebBrowser.openBrowserAsync('https://example.com/help')
            }
          />
          <GradientButton
            text="Community Guidelines"
            onPress={() =>
              WebBrowser.openBrowserAsync('https://example.com/guidelines')
            }
          />
          <GradientButton
            text="Privacy Policy"
            onPress={() =>
              WebBrowser.openBrowserAsync(
                'https://example.com/privacy-policy.html'
              )
            }
          />
          <GradientButton
            text="Terms of Service"
            onPress={() =>
              WebBrowser.openBrowserAsync('https://example.com/terms.html')
            }
          />
        </View>

        <GradientButton
          text={
            showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'
          }
          onPress={toggleAdvanced}
        />

        {showAdvanced && (
          <View style={local.sectionCard}>
            <GradientButton
              text={`Toggle ${darkMode ? 'Light' : 'Dark'} Mode`}
              onPress={toggleTheme}
            />

            <GradientButton
              text="View My Stats"
              onPress={() => navigation.navigate('Stats')}
            />


            {user?.isAdmin && (
              <GradientButton
                text="Review Flagged Users"
                onPress={() => navigation.navigate('AdminReview')}
              />
            )}

            <GradientButton text="Log Out" onPress={handleLogout} />
          </View>
        )}
      </ScreenContainer>
      </SafeKeyboardView>
    </GradientBackground>
  );
};

SettingsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const getLocalStyles = (theme) =>
  StyleSheet.create({
    sectionCard: {
      backgroundColor: theme.card,
      marginBottom: SPACING.LG,
      padding: SPACING.LG,
      borderRadius: CARD_STYLE.borderRadius,
      ...CARD_STYLE,
    },
    sectionTitle: {
      ...textStyles.subtitle,
      color: theme.text,
      marginBottom: SPACING.MD,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.MD,
    },
  });

export default SettingsScreen;
