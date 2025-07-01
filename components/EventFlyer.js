import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { eventImageSource } from '../utils/avatar';
import GradientButton from './GradientButton';
import { CARD_STYLE } from './Card';

const EventFlyer = ({ event, onJoin, joined }) => {
  const { darkMode, theme } = useTheme();
  const styles = getStyles(theme, darkMode);

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#333' : '#fff' }]}>
      <Image source={eventImageSource(event.image)} style={styles.image} />
      <View style={styles.details}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={[styles.dateChip, { backgroundColor: theme.accent }]}>
            <Text style={styles.dateText}>{event.time}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{event.description}</Text>
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
};

const getStyles = (theme, darkMode) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: CARD_STYLE.borderRadius,
      ...CARD_STYLE,
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
  });

export default EventFlyer;
