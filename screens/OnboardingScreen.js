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
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { db, auth, firebase } from '../firebase';
import { uploadAvatarAsync } from '../utils/upload';
import { sanitizeText } from '../utils/sanitize';
import { snapshotExists } from '../utils/firestore';
import { useUser } from '../contexts/UserContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { avatarSource } from '../utils/avatar';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeKeyboardView from '../components/SafeKeyboardView';

const questions = [
  { key: 'avatar', label: 'Upload your photo' },
  // TODO: allow recording a short voice or video intro and store URL in profile
  { key: 'name', label: 'What’s your name?' },
  { key: 'age', label: 'How old are you?' },
  { key: 'gender', label: 'Select your gender' },
  { key: 'genderPref', label: 'Preferred teammate gender' },
  { key: 'bio', label: 'Write a short bio' },
  { key: 'loveLanguage', label: 'Your love language?' },
  { key: 'idealDate', label: 'Describe your ideal date' },
  { key: 'location', label: 'Where are you located?' },
  { key: 'favoriteGame', label: 'Pick your favorite game' },
  { key: 'skillLevel', label: 'Your skill level?' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { darkMode, theme } = useTheme();
  const { updateUser } = useUser();
  const { markOnboarded, hasOnboarded } = useOnboarding();
  const styles = getStyles(theme);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    avatar: '',
    name: '',
    age: '',
    gender: '',
    genderPref: '',
    bio: '',
    loveLanguage: '',
    idealDate: '',
    location: '',
    favoriteGame: '',
    skillLevel: '',
  });
  const defaultGameOptions = [
    { label: 'Chess', value: 'Chess' },
    { label: 'Checkers', value: 'Checkers' },
    { label: 'Tic Tac Toe', value: 'Tic Tac Toe' },
  ];
  const [gameOptions, setGameOptions] = useState(defaultGameOptions);

  useEffect(() => {
    const unsub = db
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

  const validateField = () => {
    const value = answers[currentField];
    if (currentField === 'age') return /^\d+$/.test(value) && parseInt(value, 10) >= 18;
    if (currentField === 'avatar') return !!value;
    if (currentField === 'location') return value && value.length > 3;
    return value && value.toString().trim().length > 0;
  };

  const isValid = validateField();

  useEffect(() => {
    if (hasOnboarded) {
      return;
    }
    const checkExisting = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = db.collection('users').doc(uid);
      const snap = await ref.get();
      if (snapshotExists(snap) && snap.data().onboardingComplete) {
        updateUser(snap.data());
        markOnboarded();
      }
    };
    checkExisting();
  }, [hasOnboarded]);
  const handleNext = async () => {
    if (!auth.currentUser) {
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
            auth.currentUser.uid
          );
          setAnswers((prev) => ({ ...prev, avatar: url }));
        } catch (e) {
          console.error('Photo upload failed:', e);
          Toast.show({ type: 'error', text1: 'Failed to upload photo' });
          return;
        }
      }
      setStep(step + 1);
    } else {
      try {
        let photoURL = answers.avatar;
        if (answers.avatar && !answers.avatar.startsWith('http')) {
          photoURL = await uploadAvatarAsync(
            answers.avatar,
            auth.currentUser.uid
          );
        }

        const user = auth.currentUser;
        const profile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL,
          name: sanitizeText(answers.name.trim()),
          age: parseInt(answers.age, 10) || null,
          gender: sanitizeText(answers.gender),
        genderPref: sanitizeText(answers.genderPref),
        location: sanitizeText(answers.location),
        loveLanguage: sanitizeText(answers.loveLanguage),
        idealDate: sanitizeText(answers.idealDate),
        favoriteGame: sanitizeText(answers.favoriteGame),
        skillLevel: sanitizeText(answers.skillLevel),
        bio: sanitizeText(answers.bio.trim()),
          onboardingComplete: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('users').doc(user.uid).set(profile);
        updateUser(profile);
        markOnboarded();
        Toast.show({ type: 'success', text1: 'Profile saved!' });
      } catch (e) {
        console.error('Save error:', e);
        Toast.show({ type: 'error', text1: 'Failed to save profile' });
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
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
      console.log('Geo error:', e);
    }
  };

  useEffect(() => {
    if (currentField === 'location' && !answers.location) {
      autofillLocation();
    }
  }, [step]);

  const renderInput = () => {
    if (currentField === 'avatar') {
      return (
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          <Image source={avatarSource(answers.avatar)} style={styles.avatar} />
          {!answers.avatar && (
            <View style={styles.placeholder}>
              <Text style={{ color: '#999' }}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (currentField === 'location') {
      return (
        <TouchableOpacity style={styles.locationContainer} onPress={autofillLocation}>
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
      );
    }

    if (currentField === 'age') {
      const ageItems = Array.from({ length: 83 }, (_, i) => i + 18).map((n) => ({
        label: `${n}`, value: `${n}`,
      }));
      return (
        <RNPickerSelect
          onValueChange={(val) =>
            setAnswers((prev) => ({ ...prev, age: val }))
          }
          value={answers.age}
          placeholder={{ label: 'Select age', value: null }}
          useNativeAndroidPickerStyle={false}
          style={{
            inputIOS: styles.input,
            inputAndroid: styles.input,
            placeholder: { color: darkMode ? '#999' : '#aaa' },
          }}
          items={ageItems}
        />
      );
    }

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
      favoriteGame: gameOptions,
      skillLevel: [
        { label: 'Beginner', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Expert', value: 'Expert' },
      ],
      loveLanguage: [
        { label: 'Words of Affirmation', value: 'Words' },
        { label: 'Acts of Service', value: 'Acts' },
        { label: 'Gifts', value: 'Gifts' },
        { label: 'Quality Time', value: 'Time' },
        { label: 'Physical Touch', value: 'Touch' },
      ],
    };

    if (pickerFields[currentField]) {
      return (
        <RNPickerSelect
          onValueChange={(val) =>
            setAnswers((prev) => ({ ...prev, [currentField]: val }))
          }
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
          style={[styles.input, styles.bioInput]}
          value={answers.bio}
          onChangeText={(text) =>
            setAnswers((prev) => ({ ...prev, bio: text.slice(0, 200) }))
          }
          placeholder={questions[step].label}
          placeholderTextColor={darkMode ? '#999' : '#aaa'}
          multiline
          numberOfLines={4}
          maxLength={200}
          textAlignVertical="top"
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
    <LinearGradient colors={[styles.gradientStart, styles.gradientEnd]} style={styles.container}>
      <SafeKeyboardView style={styles.inner}>
        <Text style={styles.progressText}>{`Step ${step + 1} of ${questions.length}`}</Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.card}>
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
      </SafeKeyboardView>
    </LinearGradient>
  );
}

const getStyles = (theme) => {
  const background = theme.background;
  const cardBg = theme.card;
  const textColor = theme.text;
  const accent = theme.accent;

  return StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: background },
    inner: { flex: 1, justifyContent: 'center' },
    progressText: {
      color: textColor,
      fontSize: 16,
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
      fontSize: 22,
      marginBottom: 15,
    },
    input: {
      borderBottomWidth: 2,
      borderColor: accent,
      color: textColor,
      fontSize: 18,
      paddingVertical: 8,
    },
    bioInput: {
      height: 100,
      textAlignVertical: 'top',
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
      fontSize: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 40,
      paddingHorizontal: 10,
    },
    backButton: {
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: accent,
    },
    backButtonText: {
      color: accent,
      fontSize: 16,
    },
    nextButton: {
      backgroundColor: accent,
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 8,
    },
    nextButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    gradientStart: theme.gradientStart,
    gradientEnd: theme.gradientEnd,
  });
};
