import Toast from 'react-native-toast-message';

let crashlytics;
try {
  // Dynamically require to avoid crashes if the module isn't installed in tests
  // eslint-disable-next-line global-require
  crashlytics = require('@react-native-firebase/crashlytics').default;
} catch (e) {
  crashlytics = () => ({
    recordError: () => {},
    log: () => {},
  });
}

export const reportCrash = (error) => {
  try {
    crashlytics().recordError(error);
  } catch (err) {
    // Ignore logging failures to avoid cascading errors
  }
};

export const showFriendlyError = () => {
  Toast.show({ type: 'error', text1: 'Something went wrong.' });
};

export const handleError = (error) => {
  reportCrash(error);
  showFriendlyError();
};

export default { handleError, reportCrash, showFriendlyError };
