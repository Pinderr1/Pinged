import Toast from 'react-native-toast-message';
import { logError } from './crashlytics';

export const reportCrash = (error) => {
  try {
    logError(error);
  } catch (err) {
    // ignore logging failures to avoid cascading errors
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
