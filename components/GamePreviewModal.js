import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import GradientButton from './GradientButton';

export default function GamePreviewModal({ visible, game, onStart, onClose }) {
  const { theme } = useTheme();
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
            {game?.title}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {game?.description}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            <Text style={{ backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, fontSize: 12 }}>
              {game?.category}
            </Text>
            {game?.mode && (
              <Text style={{ backgroundColor: '#d1fae5', color: '#065f46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, fontSize: 12 }}>
                {game?.mode === 'both' ? 'Co-op or Versus' : game.mode}
              </Text>
            )}
            {game?.speed && (
              <Text style={{ backgroundColor: '#fef9c3', color: '#92400e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12 }}>
                {game.speed}
              </Text>
            )}
          </View>
          <GradientButton
            text={game?.route ? 'Start Game' : 'Coming Soon'}
            onPress={onStart}
            disabled={!game?.route}
            style={{ borderRadius: 10 }}
          />
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={{ textAlign: 'center', color: '#888' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

GamePreviewModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  game: PropTypes.object,
  onStart: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
