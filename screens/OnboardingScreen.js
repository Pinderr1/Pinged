// screens/OnboardingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeKeyboardView from '../components/SafeKeyboardView';

const questions = [
  { key: 'avatar', label: 'Upload your photo' },
  { key: 'name', label: 'What’s your name?' },
  { key: 'age', label: 'How old are you?' },
  { key: 'gender', label: 'Select your gender' },
  { key: 'bio', label: 'Write a short bio' },
  { key: 'location', label: 'Where are you located?' },
  { key: 'favoriteGame', label: 'Pick your favorite game' },
  { key: 'skillLevel', label: 'Your skill level?' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const styles = getStyles(darkMode);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    avatar: '',
    name: '',
    age: '',
    gender: '',
    bio: '',
    location: '',
    favoriteGame: '',
    skillLevel: '',
  });

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
    const checkExisting = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists() && snap.data().onboardingComplete) {
        navigation.replace('Main');
      }
    };
    checkExisting();
  }, []);
  const handleNext = async () => {
    if (!auth.currentUser) {
      Toast.show({ type: 'error', text1: 'No user signed in' });
      return;
    }

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          ...answers,
          age: parseInt(answers.age, 10),
          onboardingComplete: true,
        }, { merge: true });
        Toast.show({ type: 'success', text1: 'Profile saved!' });
        navigation.replace('Main');
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
          {answers.avatar ? (
            <Image source={{ uri: answers.avatar }} style={styles.avatar} />
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
      favoriteGame: [
        { label: 'Chess', value: 'Chess' },
        { label: 'Checkers', value: 'Checkers' },
        { label: 'Tic Tac Toe', value: 'Tic Tac Toe' },
      ],
      skillLevel: [
        { label: 'Beginner', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Expert', value: 'Expert' },
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

const getStyles = (darkMode) => {
  const background = darkMode ? '#101010' : '#FFFFFF';
  const cardBg = darkMode ? '#1a1a1a' : '#FFFFFF';
  const textColor = darkMode ? '#EEE' : '#222';
  const accent = '#FF75B5';

  return StyleSheet.create({
    container: { flex: 1, padding: 20 },
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
      backgroundColor: darkMode ? '#333' : '#eee',
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
      backgroundColor: darkMode ? '#333' : '#eee',
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
    gradientStart: '#FF75B5',
    gradientEnd: '#FF9A75',
  });
};
