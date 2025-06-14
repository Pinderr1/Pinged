import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          const data = snap.exists() ? snap.data() : {};
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            isPremium: !!data.isPremium,
            ...data,
          });
        } catch (e) {
          console.warn('Failed to load user data', e);
          setUser({ uid: fbUser.uid, email: fbUser.email, isPremium: false });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
