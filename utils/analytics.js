import { getApp } from 'firebase/app';

let analyticsInstance;

async function getAnalyticsInstance() {
  if (analyticsInstance) return analyticsInstance;
  try {
    const { getAnalytics } = await import('firebase/analytics');
    analyticsInstance = getAnalytics(getApp());
  } catch (e) {
    console.warn('Analytics not initialized', e);
    return null;
  }
  return analyticsInstance;
}

export async function logEvent(name, params = {}) {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  try {
    const { logEvent: fbLogEvent } = await import('firebase/analytics');
    fbLogEvent(analytics, name, params);
  } catch (e) {
    console.warn('logEvent failed', e);
  }
}

export async function setUserId(id) {
  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  try {
    const { setUserId: fbSetUserId } = await import('firebase/analytics');
    fbSetUserId(analytics, id);
  } catch (e) {
    console.warn('setUserId failed', e);
  }
}

export default { logEvent, setUserId };
