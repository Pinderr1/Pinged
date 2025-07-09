import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import GradientButton from './GradientButton';

export default function PremiumBanner({ onClose, onPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.subtitle}>Unlimited games & all features</Text>
        <GradientButton
          text="Go Premium"
          onPress={onPress}
          style={{ width: 140, marginVertical: 0, marginTop: 8 }}
        />
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

PremiumBanner.propTypes = {
  onClose: PropTypes.func.isRequired,
  onPress: PropTypes.func.isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
    },
    title: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    subtitle: { color: '#fff', fontSize: 13, marginTop: 2 },
    closeButton: { marginLeft: 12 },
  });
