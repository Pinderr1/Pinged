import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { eventImageSource } from '../utils/avatar';
import GradientButton from './GradientButton';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function EventFlyer({ event, onPress, joined }) {
  const { darkMode, theme } = useTheme();
  const styles = getStyles(theme);

  const countdown = event.date
    ? dayjs(event.date).fromNow()
    : null;

  return (
    <View style={[styles.card, { backgroundColor: darkMode ? '#444' : '#fff' }]}>
      <Image source={eventImageSource(event.image)} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>
        <View style={styles.row}>
          <View style={[styles.chip, { backgroundColor: theme.accent }]}>
            <Text style={styles.chipText}>{event.time}</Text>
          </View>
          {countdown && <Text style={[styles.countdown, { color: theme.accent }]}>{countdown}</Text>}
        </View>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>{event.description}</Text>
        <GradientButton
          text={joined ? 'Cancel RSVP' : 'RSVP'}
          onPress={onPress}
          width={120}
          marginVertical={6}
        />
      </View>
    </View>
  );
}

EventFlyer.propTypes = {
  event: PropTypes.object.isRequired,
  onPress: PropTypes.func,
  joined: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 16,
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
      borderRadius: 12,
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginRight: 8,
    },
    chipText: {
      color: '#fff',
      fontSize: 12,
    },
    countdown: {
      fontSize: 12,
    },
    desc: {
      fontSize: 12,
      marginTop: 2,
    },
  });

