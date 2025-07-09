import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

export default function LocationInfoModal({ visible, onClose }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.text}>
            We use your location to suggest nearby players. Your exact location is
            never shared publicly.
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

LocationInfoModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: '#0009',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
    },
    text: {
      color: theme.text,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 12,
    },
    button: {
      backgroundColor: theme.accent,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
  });
