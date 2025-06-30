import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

export default function useVoicePlayback(url) {
  const soundRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const playPause = async () => {
    if (playing) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        // ignore
      }
      setPlaying(false);
      return;
    }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      await sound.playAsync();
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.warn('Failed to play audio', e);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  return { playing, playPause };
}
