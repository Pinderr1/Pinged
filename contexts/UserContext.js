import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
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
  };

  useEffect(() => {
    let unsubProfile;
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (fbUser) {
        setLoading(true);
        const ref = doc(db, 'users', fbUser.uid);
        unsubProfile = onSnapshot(
          ref,
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

  return (
    <UserContext.Provider value={{ user, updateUser, loading }}>
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
