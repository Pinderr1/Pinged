import firebase from '../firebase';

export async function fetchPremiumFlags() {
  try {
    const callable = firebase.functions().httpsCallable('getPremiumFlags');
    const res = await callable();
    return res.data || {};
  } catch (e) {
    console.warn('Failed to fetch premium flags', e);
    return {};
  }
}

export async function activateBoost() {
  const callable = firebase.functions().httpsCallable('activateBoost');
  const res = await callable();
  return res.data || {};
}

export async function sendSuperLike(targetUid) {
  const callable = firebase.functions().httpsCallable('sendSuperLike');
  const res = await callable({ targetUid });
  return res.data || {};
}

export function computePremium(user, flags = {}) {
  const isPremium = !!user?.isPremium;
  return {
    isPremium,
    canSwipe: isPremium || !!flags.canSwipe,
    canInvite: isPremium || !!flags.canInvite,
    canBoost: isPremium || !!flags.canBoost,
    canSuperlike: isPremium || !!flags.canSuperlike,
  };
}
