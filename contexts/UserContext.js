import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'DemoUser',
    age: 24,
    gender: 'Other',
    location: 'Toronto',
    avatar: require('../assets/user1.jpg'),
    isPremium: false,
    xp: 340,
    streak: 6
  });

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
