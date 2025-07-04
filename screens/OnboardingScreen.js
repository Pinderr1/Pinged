// screens/OnboardingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Easing,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../contexts/ThemeContext';
import firebase from '../firebase';
import { uploadAvatarAsync } from '../utils/upload';
import PropTypes from 'prop-types';
import { sanitizeText } from '../utils/sanitize';
import { snapshotExists } from '../utils/firestore';
import { useUser } from '../contexts/UserContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { avatarSource } from '../utils/avatar';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SafeKeyboardView from '../components/SafeKeyboardView';
import MultiSelectList from '../components/MultiSelectList';
import { FONT_SIZES, BUTTON_STYLE, HEADER_SPACING } from '../layout';
import Header from '../components/Header';
import { allGames } from '../data/games';
import { logDev } from '../utils/logger';
import LocationInfoModal from '../components/LocationInfoModal';

const questions = [
  { key: 'avatar', label: 'Upload your photo' },
  // TODO: allow recording a short voice or video intro and store URL in profile
  { key: 'displayName', label: 'What’s your name?' },
  { key: 'age', label: 'How old are you?' },
  { key: 'genderInfo', label: 'Gender & preference' },
  { key: 'bio', label: 'Write a short bio' },
  { key: 'location', label: 'Where are you located?' },
  { key: 'favoriteGames', label: 'Select your favorite games' },
];

const requiredFields = ['avatar', 'displayName', 'age'];

export default function OnboardingScreen() {
  const { darkMode, theme } = useTheme();
  const { updateUser } = useUser();
  const { markOnboarded, hasOnboarded } = useOnboarding();
  const styles = getStyles(theme);

  const [step, setStep] = useState(0);
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1 / questions.length)).current;

  const animateStepChange = (newStep) => {
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setStep(newStep);
      cardOpacity.setValue(0);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };
  const [answers, setAnswers] = useState({
    avatar: '',
    displayName: '',
    age: '',
    gender: '',
    genderPref: '',
    bio: '',
    location: '',
    favoriteGames: [],
  });
  const defaultGameOptions = allGames.map((g) => ({
    label: g.title,
    value: g.title,
  }));
  const [gameOptions, setGameOptions] = useState(defaultGameOptions);
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('games')
      .orderBy('title')
      .onSnapshot(
        (snap) => {
          if (!snap.empty) {
            setGameOptions(
              snap.docs.map((d) => ({
                label: d.data().title,
                value: d.data().title,
              }))
            );
          }
        },
        (e) => console.warn('Failed to load games', e)
      );
    return unsub;
  }, []);

  const currentField = questions[step].key;
  const progress = (step + 1) / questions.length;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const validateField = () => {
    const value = answers[currentField];
    if (!requiredFields.includes(currentField)) return true;
    if (currentField === 'age') return /^\d+$/.test(value) && parseInt(value, 10) >= 18;
    if (currentField === 'avatar') return !!value;
    return value && value.toString().trim().length > 0;
  };

  const isValid = validateField();

  useEffect(() => {
    if (hasOnboarded) {
      return;
    }
    const checkExisting = async () => {
      const uid = firebase.auth().currentUser?.uid;
      if (!uid) return;
      const ref = firebase.firestore().collection('users').doc(uid);
      const snap = await ref.get();
      if (snapshotExists(snap) && snap.data().onboardingComplete) {
        updateUser(snap.data());
        markOnboarded();
      }
    };
    checkExisting();
  }, [hasOnboarded]);
  const handleSkip = async () => {
    if (!firebase.auth().currentUser) {
      Toast.show({ type: 'error', text1: 'No user signed in' });
      return;
    }
    await saveProfile();
  };

  const saveProfile = async () => {
    try {
      let photoURL = answers.avatar;
      if (photoURL && !photoURL.startsWith('http')) {
        photoURL = await uploadAvatarAsync(photoURL, firebase.auth().currentUser.uid);
      }

      const user = firebase.auth().currentUser;
      const profile = {
        uid: user.uid,
        email: user.email,
        displayName: sanitizeText(
          (answers.displayName || user.displayName || '').trim()
        ),
        photoURL,
        age: parseInt(answers.age, 10) || null,
        gender: sanitizeText(answers.gender),
        genderPref: sanitizeText(answers.genderPref),
        location: sanitizeText(answers.location),
        favoriteGames: answers.favoriteGames.map((g) => sanitizeText(g)),
        bio: sanitizeText(answers.bio.trim()),
        onboardingComplete: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      await firebase.firestore().collection('users').doc(user.uid).set(profile, { merge: true });
      updateUser(profile);
      markOnboarded();
      Toast.show({ type: 'success', text1: 'Profile saved!' });
    } catch (e) {
      console.error('Save error:', e);
      Toast.show({ type: 'error', text1: 'Failed to save profile' });
    }
  };
  const handleNext = async () => {
    if (!firebase.auth().currentUser) {
      Toast.show({ type: 'error', text1: 'No user signed in' });
      return;
    }

    if (step < questions.length - 1) {
      if (
        currentField === 'avatar' &&
        answers.avatar &&
        !answers.avatar.startsWith('http')
      ) {
        try {
          const url = await uploadAvatarAsync(
            answers.avatar,
            firebase.auth().currentUser.uid
          );
          setAnswers((prev) => ({ ...prev, avatar: url }));
        } catch (e) {
          console.error('Photo upload failed:', e);
          Toast.show({ type: 'error', text1: 'Failed to upload photo' });
          return;
        }
      }
      animateStepChange(step + 1);
    } else {
      await saveProfile();
    }
  };

  const handleBack = () => {
    if (step > 0) animateStepChange(step - 1);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission denied' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setAnswers((prev) => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const autofillLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync(loc.coords);
      const { city, region } = geo[0];
      setAnswers((prev) => ({ ...prev, location: `${city}, ${region}` }));
    } catch (e) {
      logDev('Geo error:', e);
    }
  };

  useEffect(() => {
    if (currentField === 'location' && !answers.location) {
      autofillLocation();
    }
  }, [step]);

  const renderInput = () => {
    const pickerFields = {
      gender: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
      ],
      genderPref: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
        { label: 'Any', value: 'Any' },
      ],
    };

    if (currentField === 'avatar') {
      return (
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {answers.avatar ? (
            <Image source={avatarSource(answers.avatar)} style={styles.avatar} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={{ color: '#999' }}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (currentField === 'location') {
      return (
        <View>
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={autofillLocation}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={28}
              color="#fff"
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>
              {answers.location ? `📍 ${answers.location}` : 'Use My Location'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoLink}
            onPress={() => setShowLocationInfo(true)}
          >
            <Text style={styles.infoLinkText}>How is my location used?</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.accent} />
          </TouchableOpacity>
        </View>
      );
    }

    if (currentField === 'age') {
      const ageItems = Array.from({ length: 83 }, (_, i) => i + 18).map((n) => ({
        label: `${n}`, value: `${n}`,
      }));
      return (
        <RNPickerSelect
          onValueChange={(val) => {
            Haptics.selectionAsync().catch(() => {});
            setAnswers((prev) => ({ ...prev, age: val }));
          }}
          value={answers.age}
          placeholder={{ label: 'Select age', value: null }}
          useNativeAndroidPickerStyle={false}
          style={{
            inputIOS: styles.input,
            inputAndroid: styles.input,
            placeholder: { color: theme.textSecondary },
          }}
          items={ageItems}
        />
      );
    }

    if (currentField === 'genderInfo') {
      return (
        <View>
          <RNPickerSelect
            onValueChange={(val) => {
              Haptics.selectionAsync().catch(() => {});
              setAnswers((prev) => ({ ...prev, gender: val }));
            }}
            value={answers.gender}
            placeholder={{ label: 'Select gender', value: null }}
            useNativeAndroidPickerStyle={false}
            style={{
              inputIOS: styles.input,
              inputAndroid: styles.input,
              placeholder: { color: darkMode ? '#999' : '#aaa' },
            }}
            items={pickerFields.gender}
          />
          <RNPickerSelect
            onValueChange={(val) => {
              Haptics.selectionAsync().catch(() => {});
              setAnswers((prev) => ({ ...prev, genderPref: val }));
            }}
            value={answers.genderPref}
            placeholder={{ label: 'Preferred teammate gender', value: null }}
            useNativeAndroidPickerStyle={false}
            style={{
              inputIOS: [styles.input, { marginTop: 20 }],
              inputAndroid: [styles.input, { marginTop: 20 }],
              placeholder: { color: darkMode ? '#999' : '#aaa' },
            }}
            items={pickerFields.genderPref}
          />
        </View>
      );
    }


    if (currentField === 'favoriteGames') {
      return (
        <MultiSelectList
          options={gameOptions}
          selected={answers.favoriteGames}
          onChange={(vals) =>
            setAnswers((prev) => ({ ...prev, favoriteGames: vals }))
          }
          theme={theme}
        />
      );
    }


    if (pickerFields[currentField]) {
      return (
        <RNPickerSelect
          onValueChange={(val) => {
            Haptics.selectionAsync().catch(() => {});
            setAnswers((prev) => ({ ...prev, [currentField]: val }));
          }}
          value={answers[currentField]}
          placeholder={{ label: `Select ${currentField}`, value: null }}
          useNativeAndroidPickerStyle={false}
          style={{
            inputIOS: styles.input,
            inputAndroid: styles.input,
            placeholder: { color: darkMode ? '#999' : '#aaa' },
          }}
          items={pickerFields[currentField]}
        />
      );
    }

    if (currentField === 'bio') {
      return (
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={answers.bio}
          onChangeText={(text) =>
            setAnswers((prev) => ({ ...prev, bio: text }))
          }
          placeholder={questions[step].label}
          placeholderTextColor={darkMode ? '#999' : '#aaa'}
          multiline
          numberOfLines={4}
        />
      );
    }

    return (
      <TextInput
        style={styles.input}
        value={answers[currentField]}
        onChangeText={(text) =>
          setAnswers((prev) => ({ ...prev, [currentField]: text }))
        }
        placeholder={questions[step].label}
        placeholderTextColor={darkMode ? '#999' : '#aaa'}
        keyboardType={currentField === 'age' ? 'numeric' : 'default'}
        autoCapitalize="none"
      />
    );
  };
  return (
    <GradientBackground colors={[styles.gradientStart, styles.gradientEnd]} style={styles.container}>
      <Header showLogoOnly />
      <SafeKeyboardView style={styles.inner}>
        <Text style={styles.progressText}>{`Step ${step + 1} of ${questions.length}`}</Text>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
          <Text style={styles.questionText}>{questions[step].label}</Text>
          {renderInput()}
        </Animated.View>

        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, { opacity: isValid ? 1 : 0.5 }]}
            onPress={handleNext}
            disabled={!isValid}
          >
            <Text style={styles.nextButtonText}>
              {step < questions.length - 1 ? 'Next' : 'Finish'}
            </Text>
          </TouchableOpacity>
        </View>
        {step >= requiredFields.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Complete Profile Later</Text>
          </TouchableOpacity>
        )}
        <LocationInfoModal
          visible={showLocationInfo}
          onClose={() => setShowLocationInfo(false)}
        />
      </SafeKeyboardView>
    </GradientBackground>
  );
}

const getStyles = (theme) => {
  const background = theme.background;
  const cardBg = theme.card;
  const textColor = theme.text;
  const accent = theme.accent;

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: HEADER_SPACING,
      paddingBottom: 20,
      backgroundColor: background,
      alignItems: 'stretch',
    },
    inner: { flex: 1, justifyContent: 'center' },
    progressText: {
      color: textColor,
      fontSize: FONT_SIZES.MD,
      textAlign: 'center',
      marginBottom: 30,
    },
    progressContainer: {
      height: 8,
      width: '100%',
      backgroundColor: theme.card,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 20,
    },
    progressBar: {
      height: '100%',
      backgroundColor: accent,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    questionText: {
      color: textColor,
      fontSize: FONT_SIZES.XL,
      marginBottom: 15,
    },
    input: {
      borderBottomWidth: 2,
      borderColor: accent,
      color: textColor,
      fontSize: FONT_SIZES.MD,
      paddingVertical: BUTTON_STYLE.paddingVertical,
    },
    imagePicker: {
      alignSelf: 'center',
      marginVertical: 20,
    },
    avatar: {
      width: 150,
      height: 150,
      borderRadius: 75,
    },
    placeholder: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: theme.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
      borderRadius: 100,
      height: 60,
      width: '90%',
      alignSelf: 'center',
      marginTop: 20,
    },
    locationIcon: {
      marginRight: 10,
    },
    locationText: {
      color: '#fff',
      fontSize: FONT_SIZES.MD,
    },
    infoLink: {
      marginTop: 10,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoLinkText: {
      color: accent,
      textDecorationLine: 'underline',
      marginRight: 4,
      fontSize: FONT_SIZES.SM,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 40,
      paddingHorizontal: 10,
    },
    backButton: {
      paddingVertical: BUTTON_STYLE.paddingVertical,
      paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
      borderRadius: BUTTON_STYLE.borderRadius,
      borderWidth: 1,
      borderColor: accent,
    },
    backButtonText: {
      color: accent,
      fontSize: FONT_SIZES.MD,
    },
    nextButton: {
      backgroundColor: accent,
      paddingVertical: BUTTON_STYLE.paddingVertical,
      paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
      borderRadius: BUTTON_STYLE.borderRadius,
    },
    nextButtonText: {
      color: '#fff',
      fontSize: FONT_SIZES.MD,
    },
    skipButton: {
      marginTop: 20,
      alignSelf: 'center',
    },
    skipButtonText: {
      color: accent,
      fontSize: FONT_SIZES.MD,
      textDecorationLine: 'underline',
    },
    gradientStart: theme.gradientStart,
    gradientEnd: theme.gradientEnd,
  });
};

OnboardingScreen.propTypes = {};
