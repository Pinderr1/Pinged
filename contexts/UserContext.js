import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import Loader from "../components/Loader";
import firebase from "../firebase";
import { useAuth } from "./AuthContext";
import { computeBadges } from "../utils/badges";
import { computeUnlocks } from "../utils/unlocks";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginBonus, setLoginBonus] = useState(false);
  const [streakReward, setStreakReward] = useState(null);
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    let unsubBlocks;
    setUser(authUser);
    if (authUser?.uid) {
      setLoading(true);
      const bRef = firebase
        .firestore()
        .collection("blocks")
        .doc(authUser.uid)
        .collection("blocked");
      unsubBlocks = bRef.onSnapshot(
        (snap) => {
          setBlocked(snap.docs.map((d) => d.id));
          setLoading(false);
        },
        () => {
          setBlocked([]);
          setLoading(false);
        },
      );
    } else {
      setBlocked([]);
      setLoading(false);
    }
    return () => {
      if (unsubBlocks) unsubBlocks();
    };
  }, [authUser]);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const dismissStreakReward = () => setStreakReward(null);

  const addActivityXP = async (amount = 10, opts = {}) => {
    if (!user?.uid) return;

    const multiplier = user.isPremium ? 1.5 : 1;
    const gained = Math.round(amount * multiplier);

    try {
      const res = await firebase
        .functions()
        .httpsCallable('incrementXp')({ amount: gained });
      const newXP = res.data?.xp ?? user.xp;
      const newStreak = res.data?.streak ?? user.streak;

      const newBadges = computeBadges({
        xp: newXP,
        streak: newStreak,
        badges: user.badges || [],
        isPremium: user.isPremium,
      });
      const newUnlocks = computeUnlocks({
        xp: newXP,
        unlocks: user.unlocks || [],
      });

      updateUser({
        xp: newXP,
        streak: newStreak,
        badges: newBadges,
        unlocks: newUnlocks,
      });

      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          lastActiveAt: firebase.firestore.FieldValue.serverTimestamp(),
          ...(opts.markPlayed
            ? { lastPlayedAt: firebase.firestore.FieldValue.serverTimestamp() }
            : {}),
          badges: firebase.firestore.FieldValue.arrayUnion(
            ...newBadges.filter((b) => !(user.badges || []).includes(b)),
          ),
          unlocks: firebase.firestore.FieldValue.arrayUnion(
            ...newUnlocks.filter((u) => !(user.unlocks || []).includes(u)),
          ),
        });
    } catch (e) {
      console.warn('Failed to increment XP', e);
    }
  };

  const addGameXP = (amount = 10) =>
    addActivityXP(amount, { markPlayed: true });

  const addLoginXP = (amount = 5) => addActivityXP(amount);

  const redeemEventTicket = async (eventId) => {
    if (!user?.uid) return;
    if ((user.eventTickets || []).includes(eventId)) return;
    updateUser({ eventTickets: [...(user.eventTickets || []), eventId] });
    try {
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .update({
          eventTickets: firebase.firestore.FieldValue.arrayUnion(eventId),
        });
    } catch (e) {
      console.warn("Failed to redeem event ticket", e);
    }
  };

  const loginBonusGiven = useRef(false);

  const blockUserAccount = async (targetUid) => {
    if (!user?.uid || !targetUid) return;
    try {
      await firebase.functions().httpsCallable("blockUser")({ targetUid });
      setBlocked((prev) =>
        prev.includes(targetUid) ? prev : [...prev, targetUid],
      );
    } catch (e) {
      console.warn("Failed to block user", e);
      Toast.show({ type: "error", text1: "Failed to block user" });
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
      Toast.show({
        type: "success",
        text1: "Daily login bonus!",
        text2: "+5 XP",
      });
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
