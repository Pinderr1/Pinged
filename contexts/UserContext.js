import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import Loader from "../components/Loader";
import firebase from "../firebase";
import { useDev } from "./DevContext";
import { useOnboarding } from "./OnboardingContext";
import { clearStoredOnboarding } from "../utils/onboarding";
import { snapshotExists } from "../utils/firestore";
import { computeBadges } from "../utils/badges";
import { computeUnlocks } from "../utils/unlocks";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { devMode } = useDev();
  const { markOnboarded, clearOnboarding } = useOnboarding();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginBonus, setLoginBonus] = useState(false);
  const devUser = {
    displayName: "Dev Tester",
    age: 99,
    gender: "Other",
    bio: "Development user",
    location: "Localhost",
    photoURL: null,
    xp: 0,
    streak: 0,
    badges: [],
    unlocks: [],
  };

  useEffect(() => {
    let unsubProfile;
    let currentUid = null;
    const unsubAuth = firebase.auth().onAuthStateChanged((fbUser) => {
      if (fbUser?.uid !== currentUid) {
        if (!fbUser && currentUid) clearStoredOnboarding(currentUid);
        clearOnboarding();
        currentUid = fbUser?.uid || null;
      }

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (fbUser) {
        setLoading(true);
        const ref = firebase.firestore().collection("users").doc(fbUser.uid);
        unsubProfile = ref.onSnapshot(
          (snap) => {
            if (snapshotExists(snap)) {
              const data = snap.data();
              if (data.onboardingComplete) markOnboarded();
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                isPremium: !!data.isPremium,
                badges: data.badges || [],
                unlocks: data.unlocks || [],
                ...data,
              });
            } else if (devMode) {
              setUser({ uid: fbUser.uid, email: fbUser.email, ...devUser });
            } else {
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                isPremium: false,
                unlocks: [],
              });
            }
            setLoading(false);
          },
          (err) => {
            console.warn("Failed to subscribe user doc", err);
            setUser({ uid: fbUser.uid, email: fbUser.email, isPremium: false });
            setLoading(false);
          },
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

  const addActivityXP = async (amount = 10, opts = {}) => {
    if (!user?.uid) return;
    const last = user.lastActiveAt
      ? user.lastActiveAt.toDate?.() || new Date(user.lastActiveAt)
      : null;
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
    const newBadges = computeBadges({
      xp: newXP,
      streak: newStreak,
      badges: user.badges || [],
      isPremium: user.isPremium,
    });
    const newUnlocks = computeUnlocks({ xp: newXP, unlocks: user.unlocks || [] });
    const updates = { xp: newXP, streak: newStreak, lastActiveAt: new Date() };
    if (opts.markPlayed) updates.lastPlayedAt = new Date();
    updateUser({ ...updates, badges: newBadges, unlocks: newUnlocks });
    try {
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .update({
        ...updates,
        lastActiveAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...(opts.markPlayed
          ? { lastPlayedAt: firebase.firestore.FieldValue.serverTimestamp() }
          : {}),
        badges: firebase.firestore.FieldValue.arrayUnion(
          ...newBadges.filter((b) => !(user.badges || []).includes(b))
        ),
        unlocks: firebase.firestore.FieldValue.arrayUnion(
          ...newUnlocks.filter((u) => !(user.unlocks || []).includes(u))
        ),
      });
    } catch (e) {
      console.warn("Failed to update XP", e);
    }
  };

  const addGameXP = (amount = 10) => addActivityXP(amount, { markPlayed: true });

  const addLoginXP = (amount = 5) => addActivityXP(amount);

  const loginBonusGiven = useRef(false);

  useEffect(() => {
    if (!user?.uid || loginBonusGiven.current) return;
    const last = user.lastActiveAt
      ? user.lastActiveAt.toDate?.() || new Date(user.lastActiveAt)
      : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let diff = 1;
    if (last) {
      const lastMid = new Date(last);
      lastMid.setHours(0, 0, 0, 0);
      diff = Math.floor((today - lastMid) / 86400000);
    }
    if (diff !== 0) {
      addLoginXP();
      setLoginBonus(true);
      Toast.show({ type: 'success', text1: 'Daily login bonus!', text2: '+5 XP' });
    }
    loginBonusGiven.current = true;
  }, [user?.uid]);

  return (
    <UserContext.Provider
      value={{ user, updateUser, addGameXP, addLoginXP, loginBonus, loading }}
    >
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Loader />
        </View>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
