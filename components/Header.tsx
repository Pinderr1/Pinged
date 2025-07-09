import { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import useUnreadNotifications from '../hooks/useUnreadNotifications';
import { HEADER_HEIGHT } from '../layout';

export interface HeaderProps {
  /** Only show the center logo */
  showLogoOnly?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showLogoOnly = false }) => {
  const navigation = useNavigation();
  const { darkMode, toggleTheme, theme } = useTheme();
  const notificationCount = useUnreadNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Profile', onPress: () => navigation.navigate('Profile') },
    { label: 'Settings', onPress: () => navigation.navigate('Settings') },
    { label: darkMode ? 'Light Mode' : 'Dark Mode', onPress: toggleTheme },
  ];

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.headerBackground }]}
    >
      <View style={styles.container}>
        {showLogoOnly ? (
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        ) : (
          <>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <View style={styles.rightIcons}>
              <TouchableOpacity
                accessibilityLabel="open menu"
                onPress={() => setMenuOpen((v) => !v)}
                style={styles.iconWrapper}
              >
                <Ionicons name="menu" size={24} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={styles.iconWrapper}
              >
                <View style={styles.bellWrapper}>
                  <Image
                    source={require('../assets/bell.png')}
                    style={[styles.icon, { tintColor: theme.text }]}
                  />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{notificationCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      {menuOpen && !showLogoOnly && (
        <View style={[styles.dropdown, { backgroundColor: theme.card }]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                setMenuOpen(false);
                item.onPress();
              }}
              style={styles.menuItem}
            >
              <Text style={[styles.menuText, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
  },
  container: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  bellWrapper: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 4,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    right: 16,
    borderRadius: 8,
    paddingVertical: 8,
    width: 160,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuText: {
    fontSize: 16,
  },
});

export default Header;
