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
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { avatarSource } from '../utils/avatar';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import SafeKeyboardView from '../components/SafeKeyboardView';
import MultiSelectList from '../components/MultiSelectList';
import { FONT_SIZES, BUTTON_STYLE, HEADER_SPACING } from '../layout';
import Header from '../components/Header';
import { allGames } from '../data/games';
import { logDev } from '../utils/logger';
import LocationInfoModal from '../components/LocationInfoModal';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import useVoicePlayback from '../hooks/useVoicePlayback';

const questions = [
  { key: 'avatar', label: 'Upload your photo' },
  { key: 'voiceIntro', label: 'Record a quick voice intro' },
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
  const { markOnboarded } = useOnboarding();
  const navigation = useNavigation();
  const db = getFirestore(firebase.app());
  const styles = getStyles(theme);

  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();
  const [answers, setAnswers] = useState({
    avatar: '',
    voiceIntro: '',
    displayName: '',
    age: '',
    gender: '',
    genderPref: '',
    bio: '',
    location: '',
    favoriteGames: [],
  });

  const { playing, playPause } = useVoicePlayback(answers.voiceIntro);

  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const animateStepChange = (newStep) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setTransitioning(false);
    }, 700);
  };
  const [answers, setAnswers] = useState({
    avatar: '',
    voiceIntro: '',
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

  const validateField = () => {
    const value = answers[currentField];
    if (!requiredFields.includes(currentField)) return true;
    if (currentField === 'age') return /^\d+$/.test(value) && parseInt(value, 10) >= 18;
    if (currentField === 'avatar') return !!value;
    return value && value.toString().trim().length > 0;
  };

  const isValid = validateField();

  useEffect(() => {
    const checkExisting = async () => {
      const uid = firebase.auth().currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snapshotExists(snap) && snap.data().onboardingComplete) {
          updateUser(snap.data());
          markOnboarded();
          navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
        }
      } catch (e) {
        console.warn('Failed to check existing profile', e);
      }
    };
    checkExisting();
  }, []);
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
        voiceIntro: answers.voiceIntro || '',
        age: parseInt(answers.age, 10) || null,
        gender: sanitizeText(answers.gender),
        genderPref: sanitizeText(answers.genderPref),
        location: sanitizeText(answers.location),
        favoriteGames: answers.favoriteGames.map((g) => sanitizeText(g)),
        bio: sanitizeText(answers.bio.trim()),
        onboardingComplete: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
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
            setAnswers((prev) => ({ ...prev, voiceIntro: url }));
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

    if (currentField === 'voiceIntro') {
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
          {answers.voiceIntro ? (
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
    <GradientBackground style={styles.container}>
      <Header showLogoOnly />
      <SafeKeyboardView style={styles.inner}>
        <Text style={styles.progressText}>{`Step ${step + 1} of ${questions.length}`}</Text>

        <View style={styles.dotsContainer}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.activeDot]}
            />
          ))}
        </View>

        {transitioning && (
          <View style={styles.transitionContainer} pointerEvents="none">
            <LottieView
              source={require('../assets/hearts.json')}
              autoPlay
              loop={false}
              style={styles.transitionAnimation}
            />
          </View>
        )}
        <View style={[styles.card, transitioning && { opacity: 0 }]}>
          <Text style={styles.questionText}>{questions[step].label}</Text>
          {renderInput()}
        </View>

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
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.card,
      marginHorizontal: 4,
    },
    activeDot: {
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
    transitionContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    transitionAnimation: {
      width: '100%',
      height: '100%',
    },
  });
};

OnboardingScreen.propTypes = {};
