import { getApp } from 'firebase/app';

let crashlyticsInstance;

async function initCrashlytics() {
  if (crashlyticsInstance !== undefined) return crashlyticsInstance;
  try {
    const { getCrashlytics } = await import('firebase/crashlytics');
    crashlyticsInstance = getCrashlytics(getApp());
  } catch (e) {
    console.warn('Crashlytics not initialized', e);
    crashlyticsInstance = null;
  }
  return crashlyticsInstance;
}

export async function logError(error, context) {
  const crashlytics = await initCrashlytics();
  if (!crashlytics) return;
  try {
    const { log, recordError } = await import('firebase/crashlytics');
    if (context) log(crashlytics, context);
    const err = error instanceof Error ? error : new Error(error);
    recordError(crashlytics, err);
  } catch (e) {
    console.warn('logError failed', e);
  }
}

export async function log(message) {
  const crashlytics = await initCrashlytics();
  if (!crashlytics) return;
  try {
    const { log: fbLog } = await import('firebase/crashlytics');
    fbLog(crashlytics, message);
  } catch (e) {
    console.warn('log failed', e);
  }
}

export { initCrashlytics };
export default { initCrashlytics, log, logError };

