import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearStoredOnboarding = async (uid) => {
  if (!uid) return;
  try {
    await AsyncStorage.removeItem(`hasOnboarded_${uid}`);
  } catch (e) {
    console.warn('Failed to clear onboarding flag', e);
  }
};
