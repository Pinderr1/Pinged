import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import styles from '../styles';
import { eventImageSource } from '../utils/avatar';
import GradientButton from './GradientButton';

const NEXT_EVENT = {
  title: 'Checkers Blitz Tournament',
  time: 'Saturday @ 7PM',
  image: require('../assets/user3.jpg'),
};

export default function EventBanner() {
  const navigation = useNavigation();
  const { darkMode, theme } = useTheme();
  const local = getStyles(theme);

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
        <Text style={local.time}>{NEXT_EVENT.time}</Text>
      </View>
      <GradientButton
        text="Join Now"
        onPress={() => navigation.navigate('Community')}
        style={{ marginLeft: 10 }}
      />
    </View>
  );
}

EventBanner.propTypes = {};

const getStyles = (theme) =>
  StyleSheet.create({
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
    color: theme.accent,
    marginTop: 2,
  },
});
