// /screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import GradientButton from '../components/GradientButton';
import Loader from '../components/Loader';
import Header from '../components/Header';
import getStyles from '../styles';
import GradientBackground from '../components/GradientBackground';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING } from '../layout';
import firebase from '../firebase';
import { games } from '../games';
import PropTypes from 'prop-types';
import useCardPressAnimation from '../hooks/useCardPressAnimation';
import EmptyState from '../components/EmptyState';

const AnimatedButton = ({ onPress, text, loading, disabled, style }) => {
  const {
    scale,
    handlePressIn,
    handlePressOut,
    playSuccess,
  } = useCardPressAnimation();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <GradientButton
        text={loading ? '' : text}
        onPress={() => {
          if (onPress) onPress(playSuccess);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        width={120}
        style={style}
        disabled={disabled}
        icon={loading ? <Loader size="small" /> : null}
      />
    </Animated.View>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const { incomingInvites, acceptGameInvite, cancelGameInvite } = useMatchmaking();
  const { user } = useUser();
  const { darkMode, theme } = useTheme();
  const styles = getStyles(theme);
  const [loadingId, setLoadingId] = useState(null);
  const [invitesLoaded, setInvitesLoaded] = useState(false);

  useEffect(() => {
    setInvitesLoaded(true);
  }, [incomingInvites]);

  const pendingInvites = incomingInvites.filter((i) => i.status === 'pending');

  const handleAccept = async (invite, animateSuccess) => {
    setLoadingId(invite.id);
    await acceptGameInvite(invite.id);
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .collection('gameInvites')
        .doc(invite.id)
        .update({ status: 'accepted' });
      const snap = await firebase.firestore().collection('users').doc(invite.from).get();
      const opp = snap.data() || {};
      navigation.navigate('GameSession', {
        game: {
          id: invite.gameId,
          title: games[invite.gameId]?.meta?.title || 'Game',
        },
        opponent: {
          id: invite.from,
          displayName: opp.displayName || 'Opponent',
          photo: opp.photoURL ? { uri: opp.photoURL } : require('../assets/user1.jpg'),
        },
        inviteId: invite.id,
        status: 'waiting',
      });
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      // TODO: play success sound here
      if (animateSuccess) animateSuccess();
    } catch (e) {
      console.warn('Failed to accept invite', e);
    }
    setLoadingId(null);
  };

  const handleDecline = async (invite) => {
    setLoadingId(invite.id + '_decline');
    cancelGameInvite(invite.id);
    await firebase
      .firestore()
      .collection('users')
      .doc(user.uid)
      .collection('gameInvites')
      .doc(invite.id)
      .update({ status: 'declined' })
      .catch((e) => console.warn('Failed to decline invite', e));
    setLoadingId(null);
    Vibration.vibrate(40);
  };

  return (
    <GradientBackground style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: HEADER_SPACING,
          padding: 20,
          paddingBottom: 120,
        }}
      >
        <Text style={[local.title, { color: theme.text }]}>Game Invites</Text>

        {pendingInvites.length === 0 ? (
          invitesLoaded ? (
            <EmptyState
              text="No invites right now."
              image={require('../assets/bell.png')}
            />
          ) : (
            [0, 1].map((i) => (
              <View
                key={`skel-${i}`}
                style={[local.card, { backgroundColor: theme.card }]}
              >
                <View
                  style={[local.skelText, { backgroundColor: theme.textSecondary }]}
                />
                <View style={local.actions}>
                  <View
                    style={[local.skelButton, { backgroundColor: theme.textSecondary }]}
                  />
                  <View
                    style={[local.skelDecline, { backgroundColor: theme.textSecondary }]}
                  />
                </View>
              </View>
            ))
          )
        ) : (
          pendingInvites.map((inv) => (
            <View
              key={inv.id}
              style={[
                local.card,
                { backgroundColor: theme.card },
              ]}
            >
              <Text style={[local.text, { color: theme.text }]}> 
                {inv.fromName ? `${inv.fromName} invited you to play ${games[inv.gameId]?.meta?.title || 'a game'}` : 'Game invite received'}
              </Text>
              <View style={local.actions}>
                <AnimatedButton
                  text="Accept"
                  onPress={(anim) => handleAccept(inv, anim)}
                  style={{ marginRight: 10, flexDirection: 'row', justifyContent: 'center' }}
                  disabled={loadingId === inv.id}
                  loading={loadingId === inv.id}
                />
                <TouchableOpacity
                  onPress={() => handleDecline(inv)}
                  disabled={loadingId === inv.id + '_decline'}
                >
                  {loadingId === inv.id + '_decline' ? (
                    <Loader size="small" />
                  ) : (
                    <Text style={{ color: theme.accent, fontSize: 13 }}>Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </GradientBackground>
  );
};

const local = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 3
  },
  text: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginTop: 40
  },
  skelText: {
    height: 14,
    borderRadius: 7,
    marginBottom: 10,
    width: '60%',
    opacity: 0.3
  },
  skelButton: {
    height: 32,
    borderRadius: 16,
    width: 100,
    marginRight: 10,
    opacity: 0.3
  },
  skelDecline: {
    height: 16,
    borderRadius: 8,
    width: 60,
    opacity: 0.3
  }
});

NotificationsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default NotificationsScreen;
