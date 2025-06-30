import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import useUnreadNotifications from '../hooks/useUnreadNotifications';

export interface HeaderProps {}
const Header: React.FC<HeaderProps> = () => {
  const navigation = useNavigation();
  const { darkMode, theme } = useTheme();
  const notificationCount = useUnreadNotifications();

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
      {/* Left icon - Gear */}
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconWrapper}>
        <Image
          source={require('../assets/gear.png')}
          style={[styles.icon, { tintColor: theme.text }]}
        />
      </TouchableOpacity>

      {/* Center logo */}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
      />

      {/* Right icon - Bell with badge */}
      <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconWrapper}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 60,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
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
  iconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  logo: {
    width: 60,
    height: 60,
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
});

export default Header;
