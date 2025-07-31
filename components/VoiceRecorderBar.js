import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import useVoiceRecorder from '../hooks/useVoiceRecorder';


export default function VoiceRecorderBar({ onFinish, color }) {
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();

  const handleFinish = async () => {
    const result = await stopRecording();
    if (result) onFinish(result);
  };

  return (
    <TouchableOpacity onLongPress={startRecording} onPressOut={handleFinish} style={{ marginRight: 6 }}>
      <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={22} color={color} />
    </TouchableOpacity>
  );
}

VoiceRecorderBar.propTypes = {
  onFinish: PropTypes.func.isRequired,
  color: PropTypes.string,
};
