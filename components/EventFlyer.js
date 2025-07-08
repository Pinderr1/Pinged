import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { eventImageSource } from '../utils/avatar';
import GradientButton from './GradientButton';
import { CARD_STYLE } from './Card';

const EventFlyer = ({ event, onJoin, joined, style }) => {
  const { darkMode, theme } = useTheme();
  const styles = getStyles(theme, darkMode);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.card },
        style,
      ]}
    >
      <Image source={eventImageSource(event.image)} style={styles.image} />
      <View style={styles.details}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={[styles.dateChip, { backgroundColor: theme.accent }]}>
            <Text style={styles.dateText}>{event.time}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{event.description}</Text>
        {event.ticketed && (
          <Text style={styles.ticketed}>🎟 Ticketed Event</Text>
        )}
        <GradientButton
          text={joined ? 'RSVP\'d' : 'RSVP'}
          onPress={onJoin}
          width={100}
          style={{ alignSelf: 'flex-start', marginVertical: 8 }}
        />
      </View>
    </View>
  );
};

EventFlyer.propTypes = {
  event: PropTypes.object.isRequired,
  onJoin: PropTypes.func,
  joined: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const getStyles = (theme, darkMode) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 18,
      borderRadius: CARD_STYLE.borderRadius,
      borderWidth: 1,
      borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e0d4b9',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 5,
      elevation: 4,
      transform: [{ rotate: '-2deg' }],
    },
    image: {
      width: 70,
      height: 70,
      borderRadius: 12,
      marginRight: 12,
    },
    details: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontWeight: 'bold',
      fontSize: 15,
      color: theme.text,
      flex: 1,
      marginRight: 8,
    },
    dateChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    dateText: {
      color: '#fff',
      fontSize: 12,
    },
    desc: {
      marginTop: 4,
      color: theme.textSecondary,
      fontSize: 13,
    },
    ticketed: {
      marginTop: 2,
      color: theme.accent,
      fontSize: 12,
    },
  });

export default EventFlyer;
