// screens/OnboardingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../contexts/ThemeContext';
import firebase from '../firebase';
import { uploadAvatarAsync, uploadIntroAsync } from '../utils/upload';
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
import GameIconPicker from '../components/GameIconPicker';
import LottieView from 'lottie-react-native';
import { BADGE_LIST } from '../utils/badges';
import { FONT_SIZES, BUTTON_STYLE, HEADER_SPACING } from '../layout';
import Header from '../components/Header';
import { allGames } from '../data/games';
import { logDev } from '../utils/logger';
import LocationInfoModal from '../components/LocationInfoModal';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import useVoicePlayback from '../hooks/useVoicePlayback';

const questions = [
  { key: 'avatar', label: 'Upload your photo' },
  { key: 'introClip', label: 'Record a quick intro' },
  { key: 'displayName', label: 'What’s your name?' },
  { key: 'personalInfo', label: 'Age & gender' },
  { key: 'mood', label: 'Your mood or status' },
  { key: 'profilePrompt1', label: 'Finish the prompt' },
  { key: 'teammateTag', label: 'Pick a personality tag' },
  { key: 'bio', label: 'Write a short bio' },
  { key: 'location', label: 'Where are you located?' },
  { key: 'favoriteGames', label: 'Select your favorite games' },
  { key: 'badges', label: 'Preview badges & XP' },
];

const requiredFields = ['avatar', 'displayName', 'personalInfo'];

export default function OnboardingScreen() {
  const { darkMode, theme } = useTheme();
  const { updateUser } = useUser();
  const { markOnboarded, hasOnboarded } = useOnboarding();
  const styles = getStyles(theme);

  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();
  const { playing, playPause } = useVoicePlayback(answers.introClip);

  const [step, setStep] = useState(0);
  const [showTransition, setShowTransition] = useState(false);

  const animateStepChange = (newStep) => {
    setShowTransition(true);
    setTimeout(() => {
      setShowTransition(false);
      setStep(newStep);
    }, 600);
  };
  const [answers, setAnswers] = useState({
    avatar: '',
    introClip: '',
    displayName: '',
    personalInfo: { age: '', gender: '', genderPref: '' },
    mood: '',
    profilePrompt1: '',
    teammateTag: '',
    bio: '',
    location: '',
    favoriteGames: [],
    badgePrefs: [],
  });
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  const currentField = questions[step].key;

  const validateField = () => {
    const value = answers[currentField];
    if (!requiredFields.includes(currentField)) return true;
    if (currentField === 'personalInfo') {
      return (
        /^\d+$/.test(value.age) &&
        parseInt(value.age, 10) >= 18 &&
        !!value.gender
      );
    }
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
    Haptics.selectionAsync().catch(() => {});
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
        try {
          photoURL = await uploadAvatarAsync(
            photoURL,
            firebase.auth().currentUser.uid
          );
        } catch (e) {
          throw e;
        }
      }

      const user = firebase.auth().currentUser;
      const profile = {
        uid: user.uid,
        email: user.email,
        displayName: sanitizeText(
          (answers.displayName || user.displayName || '').trim()
        ),
        photoURL,
        introClipUrl: answers.introClip || '',
        age: parseInt(answers.personalInfo.age, 10) || null,
        gender: sanitizeText(answers.personalInfo.gender),
        genderPref: sanitizeText(answers.personalInfo.genderPref),
        mood: sanitizeText(answers.mood),
        profilePrompt1: sanitizeText(answers.profilePrompt1),
        teammateTag: sanitizeText(answers.teammateTag),
        badgePrefs: answers.badgePrefs,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
    Haptics.selectionAsync().catch(() => {});
    if (step > 0) animateStepChange(step - 1);
  };

  const pickImage = async () => {
    Haptics.selectionAsync().catch(() => {});
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

  const handleVoicePress = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        try {
          const url = await uploadIntroAsync(
            result.uri,
            firebase.auth().currentUser.uid
          );
          if (url)
            setAnswers((prev) => ({ ...prev, introClip: url }));
        } catch (e) {
          console.error('Voice upload failed:', e);
          Toast.show({ type: 'error', text1: 'Failed to upload intro' });
        }
      }
    } else {
      await startRecording();
    }
  };

  const autofillLocation = async () => {
    Haptics.selectionAsync().catch(() => {});
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

    if (currentField === 'introClip') {
      return (
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleVoicePress}
            style={styles.voiceButton}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
          {answers.introClip ? (
            <TouchableOpacity onPress={playPause} style={styles.playButton}>
              <Ionicons
                name={playing ? 'pause' : 'play'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    if (currentField === 'location') {
      return (
        <View>
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              autofillLocation();
            }}
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
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowLocationInfo(true);
            }}
          >
            <Text style={styles.infoLinkText}>How is my location used?</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.accent} />
          </TouchableOpacity>
        </View>
      );
    }

    if (currentField === 'personalInfo') {
      const ageItems = Array.from({ length: 83 }, (_, i) => i + 18).map((n) => ({
        label: `${n}`,
        value: `${n}`,
      }));
      return (
        <View>
          <RNPickerSelect
            onValueChange={(val) => {
              Haptics.selectionAsync().catch(() => {});
              setAnswers((prev) => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, age: val },
              }));
            }}
            value={answers.personalInfo.age}
            placeholder={{ label: 'Select age', value: null }}
            useNativeAndroidPickerStyle={false}
            style={{
              inputIOS: styles.input,
              inputAndroid: styles.input,
              placeholder: { color: theme.textSecondary },
            }}
            items={ageItems}
          />
          <RNPickerSelect
            onValueChange={(val) => {
              Haptics.selectionAsync().catch(() => {});
              setAnswers((prev) => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, gender: val },
              }));
            }}
            value={answers.personalInfo.gender}
            placeholder={{ label: 'Select gender', value: null }}
            useNativeAndroidPickerStyle={false}
            style={{
              inputIOS: [styles.input, { marginTop: 20 }],
              inputAndroid: [styles.input, { marginTop: 20 }],
              placeholder: { color: darkMode ? '#999' : '#aaa' },
            }}
            items={pickerFields.gender}
          />
          <RNPickerSelect
            onValueChange={(val) => {
              Haptics.selectionAsync().catch(() => {});
              setAnswers((prev) => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, genderPref: val },
              }));
            }}
            value={answers.personalInfo.genderPref}
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

    if (currentField === 'mood') {
      const moods = [
        { label: 'Flirty', value: 'Flirty' },
        { label: 'Chill', value: 'Chill' },
        { label: 'Competitive', value: 'Competitive' },
      ];
      return (
        <RNPickerSelect
          onValueChange={(val) => {
            Haptics.selectionAsync().catch(() => {});
            setAnswers((prev) => ({ ...prev, mood: val }));
          }}
          value={answers.mood}
          placeholder={{ label: 'Select mood', value: null }}
          useNativeAndroidPickerStyle={false}
          style={{ inputIOS: styles.input, inputAndroid: styles.input }}
          items={moods}
        />
      );
    }

    if (currentField === 'profilePrompt1') {
      return (
        <TextInput
          style={styles.input}
          value={answers.profilePrompt1}
          onChangeText={(text) =>
            setAnswers((prev) => ({ ...prev, profilePrompt1: text }))
          }
          placeholder="My perfect co-op partner is..."
          placeholderTextColor={darkMode ? '#999' : '#aaa'}
        />
      );
    }

    if (currentField === 'teammateTag') {
      const tags = [
        { label: 'Strategist', value: 'Strategist' },
        { label: 'Speedrunner', value: 'Speedrunner' },
        { label: 'Trash Talker', value: 'Trash Talker' },
      ];
      return (
        <RNPickerSelect
          onValueChange={(val) => {
            Haptics.selectionAsync().catch(() => {});
            setAnswers((prev) => ({ ...prev, teammateTag: val }));
          }}
          value={answers.teammateTag}
          placeholder={{ label: 'Select tag', value: null }}
          useNativeAndroidPickerStyle={false}
          style={{ inputIOS: styles.input, inputAndroid: styles.input }}
          items={tags}
        />
      );
    }


    if (currentField === 'favoriteGames') {
      return (
        <GameIconPicker
          games={allGames}
          selected={answers.favoriteGames}
          onChange={(vals) =>
            setAnswers((prev) => ({ ...prev, favoriteGames: vals }))
          }
        />
      );
    }

    if (currentField === 'badges') {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {BADGE_LIST.map((badge) => (
            <View key={badge.id} style={{ alignItems: 'center', margin: 6 }}>
              <Ionicons
                name={badge.icon}
                size={28}
                color={theme.accent}
              />
              <Text style={{ color: theme.text, fontSize: 12 }}>{badge.title}</Text>
            </View>
          ))}
        </View>
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
    <GradientBackground style={styles.container}>
      <Header showLogoOnly />
      <SafeKeyboardView style={styles.inner}>
        <Text style={styles.progressText}>{`Step ${step + 1} of ${questions.length}`}</Text>

        <View style={styles.dotsRow}>
          {questions.map((q, idx) => (
            <View
              key={q.key}
              style={[
                styles.dot,
                idx <= step ? { backgroundColor: theme.accent } : null,
              ]}
            />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.questionText}>{questions[step].label}</Text>
          {renderInput()}
        </View>
        {showTransition && (
          <View style={styles.transitionOverlay} pointerEvents="none">
            <LottieView
              source={require('../assets/hearts.json')}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />
          </View>
        )}

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
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 4,
      backgroundColor: theme.card,
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
    voiceButton: {
      backgroundColor: accent,
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    playButton: {
      backgroundColor: accent,
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
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
    transitionOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

OnboardingScreen.propTypes = {};
