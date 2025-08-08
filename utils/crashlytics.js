let Sentry;

function initCrashlytics() {
  if (Sentry !== undefined) return;
  try {
    // eslint-disable-next-line global-require
    Sentry = require('sentry-expo');
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      enableInExpoDevelopment: true,
      debug: false,
    });
  } catch (e) {
    console.warn('Sentry not initialized', e);
    Sentry = null;
  }
}

function logError(error, context) {
  initCrashlytics();
  if (!Sentry) return;
  try {
    const err = error instanceof Error ? error : new Error(error);
    const extra = context ? { extra: { context } } : undefined;
    Sentry.Native.captureException(err, extra);
  } catch (e) {
    console.warn('logError failed', e);
  }
}

function log(message) {
  initCrashlytics();
  if (!Sentry) return;
  try {
    Sentry.Native.captureMessage(message);
  } catch (e) {
    console.warn('log failed', e);
  }
}

export { initCrashlytics, log, logError };
export default { initCrashlytics, log, logError };
