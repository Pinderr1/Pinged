import { getApp } from 'firebase/app';

let crashlyticsInstance;

async function getCrashlyticsInstance() {
  if (crashlyticsInstance) return crashlyticsInstance;
  try {
    const { getCrashlytics } = await import('firebase/crashlytics');
    crashlyticsInstance = getCrashlytics(getApp());
  } catch (e) {
    console.warn('Crashlytics not initialized', e);
    return null;
  }
  return crashlyticsInstance;
}

export async function logError(error, context = {}) {
  const crashlytics = await getCrashlyticsInstance();
  if (!crashlytics) return;
  try {
    const { log, recordError } = await import('firebase/crashlytics');
    if (context && Object.keys(context).length) {
      try {
        log(crashlytics, JSON.stringify(context));
      } catch (err) {
        // ignore logging context errors
      }
    }
    recordError(crashlytics, error);
  } catch (e) {
    console.warn('logError failed', e);
  }
}

export default { logError };
