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
  const [streakReward, setStreakReward] = useState(null);
  const [blocked, setBlocked] = useState([]);
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
    eventTickets: [],
  };

  useEffect(() => {
    let unsubProfile;
    let unsubBlocks;
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
      if (unsubBlocks) {
        unsubBlocks();
        unsubBlocks = null;
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
                eventTickets: data.eventTickets || [],
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
                eventTickets: [],
              });
            }
            setLoading(false);
          },
          (err) => {
            console.warn("Failed to subscribe user doc", err);
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              isPremium: false,
              eventTickets: [],
            });
            setLoading(false);
          },
        );
        const bRef = firebase
          .firestore()
          .collection('blocks')
          .doc(fbUser.uid)
          .collection('blocked');
        unsubBlocks = bRef.onSnapshot(
          (snap) => {
            setBlocked(snap.docs.map((d) => d.id));
          },
          () => setBlocked([]),
        );
      } else {
        setUser(null);
        setBlocked([]);
        setLoading(false);
      }
    });
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubBlocks) unsubBlocks();
    };
  }, [devMode]);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const dismissStreakReward = () => setStreakReward(null);

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

    const multiplier = user.isPremium ? 1.5 : 1;
    const gained = Math.round(amount * multiplier);
    const newXP = (user.xp || 0) + gained;
    const newBadges = computeBadges({
      xp: newXP,
      streak: newStreak,
      badges: user.badges || [],
      isPremium: user.isPremium,
    });
    const newUnlocks = computeUnlocks({ xp: newXP, unlocks: user.unlocks || [] });
    const now = new Date();
    const updates = { xp: newXP, streak: newStreak, lastActiveAt: now };
    if (opts.markPlayed) updates.lastPlayedAt = now;

    let rewardStreak = null;
    if (newStreak % 7 === 0) {
      const rewardedAt = user.streakRewardedAt
        ? user.streakRewardedAt.toDate?.() || new Date(user.streakRewardedAt)
        : null;
      if (!rewardedAt || !last || rewardedAt < last) {
        updates.streakRewardedAt = now;
        rewardStreak = newStreak;
      }
    }

    updateUser({
      ...updates,
      badges: newBadges,
      unlocks: newUnlocks,
    });
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
        ...(rewardStreak
          ? { streakRewardedAt: firebase.firestore.FieldValue.serverTimestamp() }
          : {}),
        badges: firebase.firestore.FieldValue.arrayUnion(
          ...newBadges.filter((b) => !(user.badges || []).includes(b))
        ),
        unlocks: firebase.firestore.FieldValue.arrayUnion(
          ...newUnlocks.filter((u) => !(user.unlocks || []).includes(u))
        ),
      });
      if (rewardStreak) setStreakReward(rewardStreak);
    } catch (e) {
      console.warn("Failed to update XP", e);
    }
  };

  const addGameXP = (amount = 10) => addActivityXP(amount, { markPlayed: true });

  const addLoginXP = (amount = 5) => addActivityXP(amount);

  const redeemEventTicket = async (eventId) => {
    if (!user?.uid) return;
    if ((user.eventTickets || []).includes(eventId)) return;
    updateUser({ eventTickets: [...(user.eventTickets || []), eventId] });
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          eventTickets: firebase.firestore.FieldValue.arrayUnion(eventId),
        });
    } catch (e) {
      console.warn('Failed to redeem event ticket', e);
    }
  };

  const loginBonusGiven = useRef(false);

  const blockUserAccount = async (targetUid) => {
    if (!user?.uid || !targetUid) return;
    try {
      await firebase.functions().httpsCallable('blockUser')({ targetUid });
      setBlocked((prev) => (prev.includes(targetUid) ? prev : [...prev, targetUid]));
    } catch (e) {
      console.warn('Failed to block user', e);
      Toast.show({ type: 'error', text1: 'Failed to block user' });
    }
  };

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
      value={{
        user,
        updateUser,
        addGameXP,
        addLoginXP,
        redeemEventTicket,
        blockUser: blockUserAccount,
        blocked,
        streakReward,
        dismissStreakReward,
        loginBonus,
        loading,
      }}
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
