import * as Analytics from 'expo-firebase-analytics';

export async function logEvent(name, params = {}) {
  try {
    await Analytics.logEvent(name, params);
  } catch (e) {
    console.warn('logEvent failed', e);
  }
}

export async function setUserId(id) {
  try {
    await Analytics.setUserId(id);
  } catch (e) {
    console.warn('setUserId failed', e);
  }
}

export default { logEvent, setUserId };

