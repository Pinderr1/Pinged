import React, { useState } from 'react';
import { Alert, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function BlockAction({ targetUid, displayName, style }) {
  const { blockUser } = useUser();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  if (!targetUid) return null;

  const handleBlock = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await blockUser(targetUid);
    } catch (e) {
      console.error('Failed to block user', e);
      Toast.show({ type: 'error', text1: 'Could not block user. Try later.' });
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    Alert.alert(
      `Block @${displayName}?`,
      "You won\u2019t see each other again.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: handleBlock },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={confirm} disabled={loading}>
      {loading ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : (
        <Text style={style}>Block</Text>
      )}
    </TouchableOpacity>
  );
}

BlockAction.propTypes = {
  targetUid: PropTypes.string.isRequired,
  displayName: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
