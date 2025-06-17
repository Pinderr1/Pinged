// /screens/NotificationsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Header from '../components/Header';
import styles from '../styles';
import { LinearGradient } from 'expo-linear-gradient';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { games } from '../games';

const NotificationsScreen = ({ navigation }) => {
  const { incomingInvites, acceptGameInvite, cancelGameInvite } = useMatchmaking();
  const { user } = useUser();
  const { darkMode, theme } = useTheme();
  const [loadingId, setLoadingId] = useState(null);

  const pendingInvites = incomingInvites.filter((i) => i.status === 'pending');

  const handleAccept = async (invite) => {
    setLoadingId(invite.id);
    await acceptGameInvite(invite.id);
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'gameInvites', invite.id),
        { status: 'accepted' }
      );
      const snap = await getDoc(doc(db, 'users', invite.from));
      const opp = snap.data() || {};
      navigation.navigate('GameLobby', {
        game: {
          id: invite.gameId,
          title: games[invite.gameId]?.meta?.title || 'Game',
        },
        opponent: {
          id: invite.from,
          name: opp.displayName || 'Opponent',
          photo: opp.photoURL ? { uri: opp.photoURL } : require('../assets/user1.jpg'),
        },
        inviteId: invite.id,
        status: 'waiting',
      });
    } catch (e) {
      console.warn('Failed to accept invite', e);
    }
    setLoadingId(null);
  };

  const handleDecline = async (invite) => {
    setLoadingId(invite.id + '_decline');
    cancelGameInvite(invite.id);
    await updateDoc(
      doc(db, 'users', user.uid, 'gameInvites', invite.id),
      { status: 'declined' }
    ).catch((e) => console.warn('Failed to decline invite', e));
    setLoadingId(null);
  };

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.container}
    >
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={[local.title, { color: theme.text }]}>Game Invites</Text>

        {pendingInvites.length === 0 ? (
          <Text style={[local.empty, { color: theme.textSecondary }]}>No invites right now.</Text>
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
                <TouchableOpacity
                  style={[styles.emailBtn, { marginRight: 10 }]}
                  onPress={() => handleAccept(inv)}
                >
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDecline(inv)}>
                  <Text style={{ color: theme.accent, fontSize: 13 }}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
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
  }
});

export default NotificationsScreen;
