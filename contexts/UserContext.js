import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth, db, firebase } from '../firebase';
import { useDev } from './DevContext';
import { useOnboarding } from './OnboardingContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { devMode } = useDev();
  const { markOnboarded } = useOnboarding();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const devUser = {
    displayName: 'Dev Tester',
    age: 99,
    gender: 'Other',
    bio: 'Development user',
    location: 'Localhost',
    photoURL: null,
    xp: 0,
    streak: 0,
  };

  useEffect(() => {
    let unsubProfile;
    const unsubAuth = auth.onAuthStateChanged((fbUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (fbUser) {
        setLoading(true);
        const ref = db.collection('users').doc(fbUser.uid);
        unsubProfile = ref.onSnapshot(
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.onboardingComplete) markOnboarded();
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                isPremium: !!data.isPremium,
                ...data,
              });
            } else if (devMode) {
              setUser({ uid: fbUser.uid, email: fbUser.email, ...devUser });
            } else {
              setUser({ uid: fbUser.uid, email: fbUser.email, isPremium: false });
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Failed to subscribe user doc', err);
            setUser({ uid: fbUser.uid, email: fbUser.email, isPremium: false });
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, [devMode]);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const addGameXP = async (amount = 10) => {
    if (!user?.uid) return;
    const last = user.lastPlayedAt ? user.lastPlayedAt.toDate?.() || new Date(user.lastPlayedAt) : null;
    let newStreak = user.streak || 0;
    if (last) {
      const lastMid = new Date(last);
      lastMid.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.floor((today - lastMid) / 86400000);
      if (diff === 0) {
        newStreak = user.streak || 1;
      } else if (diff === 1) {
        newStreak = (user.streak || 0) + 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newXP = (user.xp || 0) + amount;
    updateUser({ xp: newXP, streak: newStreak, lastPlayedAt: new Date() });
    try {
      await db
        .collection('users')
        .doc(user.uid)
        .update({
          xp: newXP,
          streak: newStreak,
          lastPlayedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (e) {
      console.warn('Failed to update XP', e);
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser, addGameXP, loading }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#d81b60" />
        </View>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
