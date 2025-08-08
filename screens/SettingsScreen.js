import React, { useState, useEffect } from 'react';
import {
  Alert,
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
import logger from '../utils/logger';
import { GOOGLE_PLAY_SUBSCRIPTIONS_URL } from '../config';

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
  const NOTIFICATION_TYPES = ['invites', 'idleReminders', 'streakRewards'];
  const [notificationSettings, setNotificationSettings] = useState({});
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
      logger.error('Failed to sign out', e);
      Alert.alert('Sign out failed', 'Please try again later.');
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
      logger.error('Failed to update settings', e);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const formatNotificationLabel = (id) =>
    id
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase());

  const local = getLocalStyles(theme);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.uid) return;
      try {
        const snapshot = await firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notificationSettings')
          .get();

        const settings = {};
        NOTIFICATION_TYPES.forEach((t) => {
          settings[t] = true;
        });
        snapshot.forEach((doc) => {
          settings[doc.id] = doc.data().enabled !== false;
        });
        setNotificationSettings(settings);
      } catch (e) {
        logger.error('Failed to fetch notification settings', e);
      }
    };

    fetchSettings();
  }, [user?.uid]);

  const handleToggleNotification = async (type, value) => {
    if (!user?.uid) return;
    setNotificationSettings((prev) => ({ ...prev, [type]: value }));
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notificationSettings')
        .doc(type)
        .set({ enabled: value }, { merge: true });
    } catch (e) {
      logger.error('Failed to update notification setting', e);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

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
          {!user?.phoneVerified && (
            <GradientButton
              text="Verify Phone"
              onPress={() => navigation.navigate('PhoneVerification')}
            />
          )}
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
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                    onPress={() => {
                      const newValue = !verifiedOnly;
                      setVerifiedFilter(newValue);
                      saveUserSetting({ seeVerifiedOnly: newValue });
                    }}
                  >
                    <Text style={[styles.settingText, { marginRight: 8 }]}>Verified Only</Text>
                    <Switch
                      value={verifiedOnly}
                      onValueChange={(v) => {
                        setVerifiedFilter(v);
                        saveUserSetting({ seeVerifiedOnly: v });
                      }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={local.switchRow}
            onPress={() => {
              const newValue = !discoveryEnabled;
              setDiscoveryEnabled(newValue);
              saveUserSetting({ discoveryEnabled: newValue });
            }}
          >
            <Text style={[styles.settingText, { marginRight: 8 }]}>Discovery</Text>
            <Switch
              value={discoveryEnabled}
              onValueChange={(v) => {
                setDiscoveryEnabled(v);
                saveUserSetting({ discoveryEnabled: v });
              }}
            />
          </TouchableOpacity>

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

          <TouchableOpacity
            style={local.switchRow}
            onPress={() => {
              const newValue = !allowDMs;
              setAllowDMs(newValue);
              saveUserSetting({ allowDMs: newValue });
            }}
          >
            <Text style={[styles.settingText, { marginRight: 8 }]}>Allow DMs</Text>
            <Switch
              value={allowDMs}
              onValueChange={(v) => {
                setAllowDMs(v);
                saveUserSetting({ allowDMs: v });
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={local.switchRow}
            onPress={() => {
              const newValue = !swipeSurge;
              setSwipeSurge(newValue);
              saveUserSetting({ swipeSurge: newValue });
            }}
          >
            <Text style={[styles.settingText, { marginRight: 8 }]}>Swipe Surge</Text>
            <Switch
              value={swipeSurge}
              onValueChange={(v) => {
                setSwipeSurge(v);
                saveUserSetting({ swipeSurge: v });
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={local.switchRow}
            onPress={() => {
              const newValue = !notificationsEnabled;
              setNotificationsEnabled(newValue);
              saveUserSetting({ notificationsEnabled: newValue });
            }}
          >
            <Text style={[styles.settingText, { marginRight: 8 }]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => {
                setNotificationsEnabled(v);
                saveUserSetting({ notificationsEnabled: v });
              }}
            />
          </TouchableOpacity>

          {NOTIFICATION_TYPES.map((type) => {
            const enabled = notificationSettings[type];
            return (
              <TouchableOpacity
                key={type}
                style={local.switchRow}
                onPress={() => {
                  const newValue = !enabled;
                  handleToggleNotification(type, newValue);
                }}
              >
                <Text style={[styles.settingText, { marginRight: 8 }]}>
                  {formatNotificationLabel(type)}
                </Text>
                <Switch
                  value={!!enabled}
                  onValueChange={(v) => handleToggleNotification(type, v)}
                  disabled={!notificationsEnabled}
                />
              </TouchableOpacity>
            );
          })}

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
              WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_PAYMENTS_URL)
            }
          />
          <GradientButton
            text="Manage Google Play Subscriptions"
            onPress={() =>
              WebBrowser.openBrowserAsync(GOOGLE_PLAY_SUBSCRIPTIONS_URL)
            }
          />
          <GradientButton
            text="Restore Purchases"
            onPress={() =>
              WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_RESTORE_URL)
            }
          />
        </View>

        <View style={local.sectionCard}>
          <Text style={local.sectionTitle}>Support</Text>
          <GradientButton
            text="Contact Us"
            onPress={() =>
              WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_CONTACT_URL)
            }
          />
          <GradientButton
            text="Help & Support"
            onPress={() =>
              WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_HELP_URL)
            }
          />
          <GradientButton
            text="Community Guidelines"
            onPress={() =>
              WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_GUIDELINES_URL)
            }
          />
          <GradientButton
            text="Privacy Policy"
            onPress={() =>
              WebBrowser.openBrowserAsync(
                process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL
              )
            }
          />
          <GradientButton
            text="Terms of Service"
            onPress={() =>
              WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_TERMS_URL)
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
