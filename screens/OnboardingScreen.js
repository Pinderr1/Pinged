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
import LottieView from 'lottie-react-native';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../contexts/ThemeContext';
import firebase from '../firebase';
import { uploadAvatarAsync, uploadIntroClipAsync } from '../utils/upload';
import PropTypes from 'prop-types';
import { sanitizeText } from '../utils/sanitize';
import { snapshotExists } from '../utils/firestore';
import { useUser } from '../contexts/UserContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { avatarSource, overlayAssets } from '../utils/avatar';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import * as Haptics from 'expo-haptics';
import SafeKeyboardView from '../components/SafeKeyboardView';
import MultiSelectList from '../components/MultiSelectList';
import GameSelectList from '../components/GameSelectList';
import { FONT_SIZES, BUTTON_STYLE, HEADER_SPACING } from '../layout';
import Header from '../components/Header';
import { allGames } from '../data/games';
import { BADGE_LIST } from '../data/badges';
import { logDev } from '../utils/logger';
import LocationInfoModal from '../components/LocationInfoModal';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import useVoicePlayback from '../hooks/useVoicePlayback';
import { PRESETS } from '../data/presets';
import Loader from '../components/Loader';

const overlayOptions = [
  { id: 'heart', src: overlayAssets.heart },
  { id: 'star', src: overlayAssets.star },
  { id: 'badge', src: overlayAssets.badge },
];

const questions = [
  { key: 'avatar', label: 'Upload your photo' },
  { key: 'introClip', label: 'Record a quick intro clip' },
  { key: 'displayName', label: 'What’s your name?' },
  { key: 'ageGender', label: 'Age & gender' },
  { key: 'bio', label: 'Write a short bio' },
  { key: 'location', label: 'Where are you located?' },
  { key: 'preset', label: 'Choose a preset' },
  { key: 'mood', label: 'How are you feeling today?' },
  { key: 'favoriteGames', label: 'Select your favorite games' },
  { key: 'promptResponses', label: 'Answer some prompts' },
  { key: 'personalityTags', label: 'Add personality tags' },
  { key: 'badgePrefs', label: 'Choose badge preferences' },
];

const requiredFields = ['avatar', 'displayName', 'ageGender'];
// Determine the index of the last required question in the flow
const lastRequiredIndex = Math.max(
  ...requiredFields.map((field) =>
    questions.findIndex((q) => q.key === field)
  )
);

export default function OnboardingScreen() {
  const { darkMode, theme } = useTheme();
  const { updateUser } = useUser();
  const { markOnboarded } = useOnboarding();
  const navigation = useNavigation();
  const styles = getStyles(theme);

  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();
  const [answers, setAnswers] = useState({
    avatar: '',
    overlay: '',
    introClip: '',
    displayName: '',
    age: '',
    gender: '',
    genderPref: '',
    bio: '',
    location: '',
    preset: 'default',
    mood: PRESETS[0].mood,
    favoriteGames: [],
    promptResponses: ['', '', ''],
    personalityTags: '',
    badgePrefs: [],
  });

  const { playing, playPause } = useVoicePlayback(
    answers.introClip && answers.introClip.endsWith('.m4a') ? answers.introClip : null
  );

  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const progressAnim = useRef(new Animated.Value(1 / questions.length)).current;
  const transitionAnim = useRef(null);

  const animateStepChange = (newStep) => {
    setTransitioning(true);
    transitionAnim.current?.reset();
    transitionAnim.current?.play();
    setTimeout(() => {
      setStep(newStep);
      setTransitioning(false);
    }, 600);
  };
  // favorite games selection uses static list from data/games.js
  const badgeOptions = BADGE_LIST.map((b) => ({ label: b.title, value: b.id }));
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentField = questions[step].key;
  const progress = (step + 1) / questions.length;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

const validateField = () => {
  const value = answers[currentField];
  if (!requiredFields.includes(currentField)) return true;
  if (currentField === 'ageGender')
    return /^\d+$/.test(answers.age) && parseInt(answers.age, 10) >= 18;
  if (currentField === 'avatar') return !!value;
  return value && value.toString().trim().length > 0;
};

  const validateAnswers = (checkAll = false) => {
    const keys = checkAll
      ? questions.map((q) => q.key)
      : requiredFields;
    for (const key of keys) {
      const val = answers[key];
      const label = questions.find((q) => q.key === key)?.label || key;
      if (key === 'ageGender') {
        if (!/^\d+$/.test(answers.age) || parseInt(answers.age, 10) < 18) {
          Toast.show({ type: 'error', text1: 'Age must be 18 or older' });
          return false;
        }
        if (!answers.gender) {
          Toast.show({ type: 'error', text1: 'Please select a gender' });
          return false;
        }
        continue;
      }
      if (key === 'favoriteGames') {
        if (!Array.isArray(val) || val.length === 0) {
          Toast.show({ type: 'error', text1: 'Select at least one favorite game' });
          return false;
        }
        continue;
      }
      if (key === 'promptResponses') {
        if (!Array.isArray(val) || val.some((p) => !p.trim())) {
          Toast.show({ type: 'error', text1: 'Please answer all prompts' });
          return false;
        }
        continue;
      }
      if (key === 'badgePrefs') {
        if (!Array.isArray(val) || val.length === 0) {
          Toast.show({ type: 'error', text1: 'Choose badge preferences' });
          return false;
        }
        continue;
      }
      if (!val || !val.toString().trim()) {
        Toast.show({ type: 'error', text1: `Please complete: ${label}` });
        return false;
      }
    }
    return true;
  };

  const isValid = validateField();

  useEffect(() => {
    const checkExisting = async () => {
      const uid = firebase.auth().currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await firebase
          .firestore()
          .collection('users')
          .doc(uid)
          .get();
        if (snapshotExists(snap) && snap.data().onboardingComplete) {
          updateUser(snap.data());
          markOnboarded();
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
      } catch (e) {
        console.warn('Failed to check existing profile', e);
      }
    };
    checkExisting();
  }, []);
  const handleSkip = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (saving) return;
    if (!firebase.auth().currentUser) {
      Toast.show({ type: 'error', text1: 'No user signed in' });
      return;
    }
    if (!validateAnswers(true)) return;
    await saveProfile();
  };

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const user = firebase.auth().currentUser;
      const userRef = firebase.firestore().collection('users').doc(user.uid);
      const existingSnap = await userRef.get();

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

      const profile = {
        uid: user.uid,
        email: user.email,
        displayName: sanitizeText(
          (answers.displayName || user.displayName || '').trim()
        ),
        photoURL,
        avatarOverlay: answers.overlay || '',
        introClipUrl: answers.introClip || '',
        age: parseInt(answers.age, 10) || null,
        gender: sanitizeText(answers.gender),
        genderPref: sanitizeText(answers.genderPref),
        location: sanitizeText(answers.location),
        mood: sanitizeText(answers.mood.trim()),
        favoriteGames: answers.favoriteGames.map((g) => sanitizeText(g)),
        promptResponses: answers.promptResponses.map((p) =>
          sanitizeText(p.trim())
        ),
        personalityTags: sanitizeText(answers.personalityTags.trim()),
        badgePrefs: answers.badgePrefs.map((b) => sanitizeText(b)),
        bio: sanitizeText(answers.bio.trim()),
        themePreset: answers.preset,
        onboardingComplete: true,
      };

      if (!snapshotExists(existingSnap)) {
        profile.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      await userRef.set(profile, { merge: true });
      updateUser(profile);
      markOnboarded();
      Toast.show({ type: 'success', text1: 'Profile saved!' });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      console.error('Save error:', e);
      Toast.show({ type: 'error', text1: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };
  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (saving) return;
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
      if (!validateAnswers(true)) return;
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

  const handleAudioPress = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        try {
          const url = await uploadIntroClipAsync(
            result.uri,
            firebase.auth().currentUser.uid
          );
          if (url) setAnswers((prev) => ({ ...prev, introClip: url }));
        } catch (e) {
          console.error('Intro clip upload failed:', e);
          Toast.show({ type: 'error', text1: 'Failed to upload intro' });
        }
      }
    } else {
      await startRecording();
    }
  };

  const handleVideoPress = async () => {
    Haptics.selectionAsync().catch(() => {});
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission denied' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 15,
    });
    if (!result.canceled) {
      try {
        const url = await uploadIntroClipAsync(
          result.assets[0].uri,
          firebase.auth().currentUser.uid
        );
        if (url) setAnswers((prev) => ({ ...prev, introClip: url }));
      } catch (e) {
        console.error('Intro clip upload failed:', e);
        Toast.show({ type: 'error', text1: 'Failed to upload intro' });
      }
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
        <>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {answers.avatar ? (
              <View>
                <Image source={avatarSource(answers.avatar)} style={styles.avatar} />
                {answers.overlay ? (
                  <Image
                    source={overlayAssets[answers.overlay]}
                    style={[styles.avatar, styles.overlayImage]}
                  />
                ) : null}
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Text style={{ color: '#999' }}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.overlaySelector}>
            {overlayOptions.map((o) => (
              <TouchableOpacity
                key={o.id}
                onPress={() =>
                  setAnswers((prev) => ({ ...prev, overlay: o.id }))
                }
                style={[
                  styles.overlayOption,
                  answers.overlay === o.id && styles.overlaySelected,
                ]}
              >
                <Image source={o.src} style={styles.overlayThumb} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      );
    }

    if (currentField === 'introClip') {
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={handleAudioPress} style={styles.voiceButton}>
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleVideoPress}
              style={[styles.voiceButton, { marginLeft: 20 }]}
            >
              <Ionicons name="videocam" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          {answers.introClip ? (
            answers.introClip.endsWith('.m4a') ? (
              <TouchableOpacity onPress={playPause} style={styles.playButton}>
                <Ionicons
                  name={playing ? 'pause' : 'play'}
                  size={28}
                  color="#fff"
                />
              </TouchableOpacity>
            ) : (
              <Video
                source={{ uri: answers.introClip }}
                style={{ width: 200, height: 200, marginTop: 10 }}
                useNativeControls
                resizeMode="contain"
              />
            )
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

    if (currentField === 'preset') {
      const options = PRESETS.map((p) => ({ label: p.label, value: p.id }));
      return (
        <RNPickerSelect
          onValueChange={(val) => {
            Haptics.selectionAsync().catch(() => {});
            const preset = PRESETS.find((p) => p.id === val) || PRESETS[0];
            setAnswers((prev) => ({
              ...prev,
              preset: val,
              mood: preset.mood,
            }));
          }}
          value={answers.preset}
          placeholder={{ label: 'Select a preset', value: null }}
          useNativeAndroidPickerStyle={false}
          style={{
            inputIOS: styles.input,
            inputAndroid: styles.input,
            placeholder: { color: darkMode ? '#999' : '#aaa' },
          }}
          items={options}
        />
      );
    }

    if (currentField === 'ageGender') {
      const ageItems = Array.from({ length: 83 }, (_, i) => i + 18).map((n) => ({
        label: `${n}`,
        value: `${n}`,
      }));
      return (
        <View>
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
          <RNPickerSelect
            onValueChange={(val) => {
              Haptics.selectionAsync().catch(() => {});
              setAnswers((prev) => ({ ...prev, gender: val }));
            }}
            value={answers.gender}
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


    if (currentField === 'mood') {
      return (
        <TextInput
          style={styles.input}
          value={answers.mood}
          onChangeText={(text) =>
            setAnswers((prev) => ({ ...prev, mood: text }))
          }
          placeholder={questions[step].label}
          placeholderTextColor={darkMode ? '#999' : '#aaa'}
        />
      );
    }

    if (currentField === 'favoriteGames') {
      return (
        <GameSelectList
          selected={answers.favoriteGames}
          onChange={(vals) =>
            setAnswers((prev) => ({ ...prev, favoriteGames: vals }))
          }
          theme={theme}
          showPreviewBadges
        />
      );
    }

    if (currentField === 'promptResponses') {
      return (
        <View>
          {answers.promptResponses.map((val, idx) => (
            <TextInput
              key={idx}
              style={[styles.input, idx > 0 && { marginTop: 10 }]}
              value={val}
              onChangeText={(text) => {
                const arr = [...answers.promptResponses];
                arr[idx] = text;
                setAnswers((prev) => ({ ...prev, promptResponses: arr }));
              }}
              placeholder={`Response ${idx + 1}`}
              placeholderTextColor={darkMode ? '#999' : '#aaa'}
            />
          ))}
        </View>
      );
    }

    if (currentField === 'personalityTags') {
      return (
        <TextInput
          style={styles.input}
          value={answers.personalityTags}
          onChangeText={(text) =>
            setAnswers((prev) => ({ ...prev, personalityTags: text }))
          }
          placeholder="Comma separated tags"
          placeholderTextColor={darkMode ? '#999' : '#aaa'}
        />
      );
    }

    if (currentField === 'badgePrefs') {
      return (
        <MultiSelectList
          options={badgeOptions}
          selected={answers.badgePrefs}
          onChange={(vals) =>
            setAnswers((prev) => ({ ...prev, badgePrefs: vals }))
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
        keyboardType="default"
        autoCapitalize="none"
      />
    );
  };

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {questions.map((_, idx) => (
        <View
          key={idx}
          style={[styles.dot, idx === step && styles.activeDot]}
        />
      ))}
    </View>
  );
  return (
    <GradientBackground style={styles.container}>
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

        {renderDots()}

        <View style={styles.card}>
          <Text style={styles.questionText}>{questions[step].label}</Text>
          {renderInput()}
        </View>

        {transitioning && (
          <View style={styles.transitionOverlay} pointerEvents="none">
            <LottieView
              ref={transitionAnim}
              source={require('../assets/hearts.json')}
              autoPlay
              loop={false}
              style={styles.transitionAnimation}
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
            style={[
              styles.nextButton,
              { opacity: saving || !isValid ? 0.5 : 1 },
            ]}
            onPress={handleNext}
            disabled={!isValid || saving}
          >
            {saving ? (
              <Loader size="small" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step < questions.length - 1 ? 'Next' : 'Finish'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {step >= lastRequiredIndex && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={saving}
          >
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
    overlayImage: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    overlaySelector: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    overlayOption: {
      marginHorizontal: 6,
      padding: 4,
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: 8,
    },
    overlaySelected: {
      borderColor: accent,
    },
    overlayThumb: { width: 40, height: 40, borderRadius: 20 },
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
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0004',
    },
    transitionAnimation: {
      width: 200,
      height: 200,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.card,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: accent,
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  });
};

OnboardingScreen.propTypes = {};
