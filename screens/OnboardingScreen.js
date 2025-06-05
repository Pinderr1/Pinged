import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const questions = [
  { key: 'name', label: 'What’s your name?' },
  { key: 'age', label: 'How old are you?' },
  { key: 'gender', label: 'What’s your gender?' },
  { key: 'bio', label: 'Write a short bio.' },
  { key: 'location', label: 'Where are you located?' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const styles = getStyles(darkMode);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: '',
    age: '',
    gender: '',
    bio: '',
    location: '',
  });

  const currentField = questions[step].key;
  const isValid = answers[currentField].trim().length > 0;

  const handleNext = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'No user signed in.');
      return;
    }

    const uid = auth.currentUser.uid;
    const data = { ...answers, onboardingComplete: true };

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      try {
        await setDoc(doc(db, 'users', uid), data, { merge: true });
        navigation.replace('Main');
      } catch (err) {
        console.log('Firestore save error:', err);
        Alert.alert('Error', 'Failed to save data. Try again.');
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <LinearGradient colors={[styles.gradientStart, styles.gradientEnd]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <Text style={styles.progressText}>{`Step ${step + 1} of ${questions.length}`}</Text>

        <View style={styles.card}>
          <Text style={styles.questionText}>{questions[step].label}</Text>
          <TextInput
            style={styles.input}
            value={answers[currentField]}
            onChangeText={(text) =>
              setAnswers((prev) => ({ ...prev, [currentField]: text }))
            }
            placeholder={questions[step].label}
            placeholderTextColor={darkMode ? '#999' : '#aaa'}
            autoCapitalize="none"
          />
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
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (darkMode) => {
  const background = darkMode ? '#101010' : '#FFFFFF';
  const cardBg = darkMode ? '#1a1a1a' : '#FFFFFF';
  const textColor = darkMode ? '#EEE' : '#222';
  const subtextColor = darkMode ? '#999' : '#666';
  const accent = '#FF75B5';

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
    },
    progressText: {
      color: textColor,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
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
