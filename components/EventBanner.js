import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import styles from '../styles';
import { eventImageSource } from '../utils/avatar';

const NEXT_EVENT = {
  title: 'Checkers Blitz Tournament',
  time: 'Saturday @ 7PM',
  image: require('../assets/user3.jpg'),
};

export default function EventBanner() {
  const navigation = useNavigation();
  const { darkMode, theme } = useTheme();

  return (
    <View
      style={[
        local.container,
        { backgroundColor: darkMode ? '#333' : '#fff' },
      ]}
    >
      <Image source={eventImageSource(NEXT_EVENT.image)} style={local.image} />
      <View style={{ flex: 1 }}>
        <Text style={local.title}>{NEXT_EVENT.title}</Text>
        <Text style={[local.time, { color: theme.accent }]}>{NEXT_EVENT.time}</Text>
      </View>
      <TouchableOpacity
        style={[styles.emailBtn, { marginLeft: 10 }]}
        onPress={() => navigation.navigate('Community')}
      >
        <Text style={styles.btnText}>Join Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const local = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 13,
    marginTop: 2,
  },
});
