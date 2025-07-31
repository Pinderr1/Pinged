import React, { createContext, useContext, useEffect } from 'react';
import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '../firebase';
import { useUser } from './UserContext';
import { useListeners } from './ListenerContext';
import debounce from '../utils/debounce';

const STORAGE_PREFIX = 'chatMatches_';
const STORAGE_VERSION = 1;
const getStorageKey = (uid) => `${STORAGE_PREFIX}${uid}`;

const useMatchesStore = create((set) => ({
  matches: [],
  loading: true,
  setMatches: (matches) => set({ matches }),
  setLoading: (loading) => set({ loading }),
}));

const MatchesContext = createContext(useMatchesStore);

export const MatchesProvider = ({ children }) => {
  const { user } = useUser();
  const {
    matches: listenerMatches,
    loadMoreMatches,
    hasMoreMatches,
  } = useListeners();
  const setMatches = useMatchesStore((s) => s.setMatches);
  const setLoading = useMatchesStore((s) => s.setLoading);

  // load from storage
  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) {
      setMatches([]);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }
    setLoading(true);
    AsyncStorage.getItem(getStorageKey(user.uid))
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const list = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.data)
              ? parsed.data
              : [];
            setMatches(list);
          } catch (e) {
            console.warn('Failed to parse matches from storage', e);
            setMatches([]);
          }
        } else {
          setMatches([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user?.uid, setMatches, setLoading]);

  // update from listener matches
  useEffect(() => {
    if (!user?.uid) return;
    setMatches(
      listenerMatches.map((m) => {
        const otherId = Array.isArray(m.users)
          ? m.users.find((u) => u !== user.uid)
          : null;
        return {
          id: m.id,
          otherUserId: otherId,
          matchedAt: m.createdAt ? m.createdAt.toDate?.().toISOString() : 'now',
        };
      })
    );
    setLoading(false);
  }, [listenerMatches, user?.uid, setMatches, setLoading]);

  const refreshMatches = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const snap = await firebase
        .firestore()
        .collection('matches')
        .where('users', 'array-contains', user.uid)
        .get();
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMatches(
        data.map((m) => ({
          id: m.id,
          otherUserId: Array.isArray(m.users)
            ? m.users.find((u) => u !== user.uid)
            : null,
          matchedAt: m.createdAt ? m.createdAt.toDate?.().toISOString() : 'now',
        }))
      );
    } catch (e) {
      console.warn('Failed to refresh matches', e);
    }
    setLoading(false);
  };

  const addMatch = (match) =>
    useMatchesStore.setState((state) => {
      if (state.matches.find((m) => m.id === match.id)) return state;
      return { matches: [...state.matches, match] };
    });

  const removeMatch = (matchId) =>
    useMatchesStore.setState((state) => ({
      matches: state.matches.filter((m) => m.id !== matchId),
    }));

  // save to storage periodically
  useEffect(() => {
    if (!user?.uid) return;
    const save = debounce((data) => {
      AsyncStorage.setItem(
        getStorageKey(user.uid),
        JSON.stringify({ v: STORAGE_VERSION, data })
      ).catch((err) => {
        console.warn('Failed to save matches to storage', err);
      });
    }, 10000);
    const unsub = useMatchesStore.subscribe((state) => save(state.matches));
    return unsub;
  }, [user?.uid]);

  return (
    <MatchesContext.Provider
      value={{
        useStore: useMatchesStore,
        loadMoreMatches,
        hasMoreMatches,
        refreshMatches,
        addMatch,
        removeMatch,
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
};

export const useMatches = () => {
  const ctx = useContext(MatchesContext);
  const store = ctx?.useStore || useMatchesStore;
  return {
    matches: store((s) => s.matches),
    loading: store((s) => s.loading),
    refreshMatches: ctx.refreshMatches,
    loadMoreMatches: ctx.loadMoreMatches,
    hasMoreMatches: ctx.hasMoreMatches,
    addMatch: ctx.addMatch,
    removeMatch: ctx.removeMatch,
  };
};
