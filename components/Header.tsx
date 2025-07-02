import React from 'react';
import { SafeAreaView, View, Image, TouchableOpacity, StyleSheet, Platform, Text, Switch } from 'react-native';
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.headerBackground }]}>
      <View style={styles.container}>
        {!showLogoOnly && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconWrapper}
          >
            <Image
              source={require('../assets/gear.png')}
              style={[styles.icon, { tintColor: theme.text }]}
            />
          </TouchableOpacity>
        )}

        {/* Center logo */}
        <Image source={require('../assets/logo.png')} style={styles.logo} />

        {!showLogoOnly && (
          <View style={styles.rightIcons}>
            <View style={styles.iconWrapper}>
              <Switch
                accessibilityLabel="toggle dark mode"
                value={darkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: theme.accent }}
                thumbColor={Platform.OS === 'android' ? '#f4f3f4' : undefined}
              />
            </View>
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
        )}
      </View>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  bellWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
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
