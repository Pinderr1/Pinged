import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING } from '../layout';
import PropTypes from 'prop-types';
import { FONT_FAMILY } from '../textStyles';
import { shadowStyle } from '../styles/common';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = SCREEN_HEIGHT;
const BUTTON_ROW_BOTTOM = SCREEN_HEIGHT * 0.05;

export default function UserCard({
  user,
  panHandlers,
  pan,
  likeOpacity,
  nopeOpacity,
  superLikeOpacity,
  imageIndex,
  onImagePress,
  onShowDetails,
  onShowProfile,
  isBoosted,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!user) return null;
  return (
    <Animated.View
      {...panHandlers}
      style={[
        styles.card,
        shadowStyle,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            {
              rotate: pan.x.interpolate({
                inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                outputRange: ['-15deg', '0deg', '15deg'],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={1} onPress={onImagePress} style={{ flex: 1 }}>
        <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
          <Text style={[styles.badgeText, styles.likeText]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
          <Text style={[styles.badgeText, styles.nopeText]}>NOPE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.superLikeBadge, { opacity: superLikeOpacity }]}>
          <Text style={[styles.badgeText, styles.superLikeText]}>SUPER{"\n"}LIKE</Text>
        </Animated.View>
        <Image source={user.images[imageIndex]} style={styles.image} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay} />
        <View style={styles.bottomInfo}>
          <Text style={styles.distanceBadge}>Nearby</Text>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {user.displayName}, {user.age}
            </Text>
            <Ionicons name="checkmark-circle" size={20} color={theme.accent} style={{ marginLeft: 6 }} />
            {isBoosted && (
              <View style={styles.boostBadge}>
                <Text style={styles.boostBadgeText}>🔥 Boosted</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onShowDetails} style={styles.expandIcon}>
            <Ionicons name="chevron-up" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShowProfile} style={styles.infoIcon}>
            <Ionicons name="information-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

UserCard.propTypes = {
  user: PropTypes.object,
  panHandlers: PropTypes.object,
  pan: PropTypes.object,
  likeOpacity: PropTypes.object,
  nopeOpacity: PropTypes.object,
  superLikeOpacity: PropTypes.object,
  imageIndex: PropTypes.number.isRequired,
  onImagePress: PropTypes.func.isRequired,
  onShowDetails: PropTypes.func.isRequired,
  onShowProfile: PropTypes.func.isRequired,
  isBoosted: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      width: SCREEN_WIDTH * 0.9,
      height: CARD_HEIGHT,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: '#fff',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: '40%',
    },
    bottomInfo: {
      position: 'absolute',
      bottom: BUTTON_ROW_BOTTOM + 80,
      left: 0,
      right: 0,
      paddingHorizontal: SPACING.XL,
      paddingVertical: SPACING.MD,
    },
    distanceBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.accent,
      color: '#fff',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginBottom: SPACING.XS,
      fontSize: 12,
      fontFamily: FONT_FAMILY.medium,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    nameText: {
      fontSize: 24,
      fontFamily: FONT_FAMILY.heading,
      color: '#fff',
    },
    expandIcon: {
      position: 'absolute',
      bottom: -30,
      alignSelf: 'center',
    },
    infoIcon: {
      position: 'absolute',
      top: SPACING.MD,
      right: SPACING.MD,
    },
    badge: {
      position: 'absolute',
      top: 40,
      padding: 10,
      borderWidth: 4,
      borderRadius: 8,
    },
    likeBadge: {
      left: 20,
      borderColor: '#4ade80',
      transform: [{ rotate: '-30deg' }],
      backgroundColor: 'rgba(74, 222, 128, 0.2)',
    },
    nopeBadge: {
      right: 20,
      borderColor: '#f87171',
      transform: [{ rotate: '30deg' }],
      backgroundColor: 'rgba(248, 113, 113, 0.2)',
    },
    badgeText: {
      fontSize: 32,
      fontFamily: FONT_FAMILY.bold,
      color: '#fff',
    },
    likeText: { color: '#4ade80' },
    nopeText: { color: '#f87171' },
    boostBadge: {
      marginLeft: SPACING.SM,
      backgroundColor: theme.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    boostBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    superLikeBadge: {
      top: CARD_HEIGHT / 2 - 20,
      left: SCREEN_WIDTH / 2 - 80,
      borderColor: '#60a5fa',
      transform: [{ rotate: '0deg' }],
      backgroundColor: 'rgba(96, 165, 250, 0.2)',
    },
    superLikeText: { color: '#60a5fa' },
  });
