import { useState, useRef } from 'react';
import { Audio } from 'expo-av';

export default function useVoiceRecorder() {
  const recording = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = rec;
      setIsRecording(true);
    } catch (e) {
      console.warn('Failed to start recording', e);
    }
  };

  const stopRecording = async () => {
    if (!recording.current) return null;
    try {
      await recording.current.stopAndUnloadAsync();
      const status = await recording.current.getStatusAsync();
      const uri = recording.current.getURI();
      const duration = status.durationMillis;
      recording.current = null;
      setIsRecording(false);
      return { uri, duration };
    } catch (e) {
      console.warn('Failed to stop recording', e);
      recording.current = null;
      setIsRecording(false);
      return null;
    }
  };

  return { startRecording, stopRecording, isRecording };
}
