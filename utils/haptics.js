import * as Haptics from 'expo-haptics';

export const lightFeedback = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // ignore errors on unsupported platforms
  }
};

export const selectionFeedback = () => {
  try {
    Haptics.selectionAsync();
  } catch (e) {
    // ignore errors on unsupported platforms
  }
};
