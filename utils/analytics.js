import * as Analytics from 'expo-firebase-analytics';

const analytics = {
  async logEvent(name, params) {
    try {
      await Analytics.logEvent(name, params);
    } catch (e) {
      console.warn('logEvent failed', e);
    }
  },

  async setUserId(id) {
    try {
      await Analytics.setUserId(id);
    } catch (e) {
      console.warn('setUserId failed', e);
    }
  },
};

export default analytics;
