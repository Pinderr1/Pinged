import firebase from '../firebase';

export async function fetchPremiumFlags() {
  try {
    const fn = firebase.functions().httpsCallable('getPremiumFlags');
    const res = await fn();
    return res.data || {};
  } catch (e) {
    console.warn('Failed to fetch premium flags', e);
    return {};
  }
}

export async function activateBoost() {
  try {
    const fn = firebase.functions().httpsCallable('activateBoost');
    const res = await fn();
    return res.data || {};
  } catch (e) {
    console.warn('Failed to activate boost', e);
    throw e;
  }
}

export async function sendSuperlike(targetUid) {
  try {
    const fn = firebase.functions().httpsCallable('sendSuperlike');
    const res = await fn({ targetUid });
    return res.data || {};
  } catch (e) {
    console.warn('Failed to send superlike', e);
    throw e;
  }
}
