import React, { createContext, useContext, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const soundsRef = useRef({});

  const loadSound = async (key) => {
    return null;
  };

  const play = async (key) => {
    if (!key) return;
    try {
      let sound = soundsRef.current[key];
      if (!sound) {
        sound = await loadSound(key);
        if (sound) soundsRef.current[key] = sound;
      }
      await sound?.replayAsync();
    } catch (e) {
      console.warn('Failed to play sound', key, e);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(soundsRef.current).forEach((s) => s?.unloadAsync());
    };
  }, []);

  return (
    <SoundContext.Provider value={{ play }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);

export default SoundContext;
