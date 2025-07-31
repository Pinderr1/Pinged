import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';
import firebase from '../firebase';
import AvatarRing from './AvatarRing';
import VoiceMessageBubble from './VoiceMessageBubble';
import EmptyState from './EmptyState';
import Loader from './Loader';
import { games, gameList } from '../games';
import { icebreakers } from '../data/prompts';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import * as chatApi from '../utils/chatApi';

const REACTIONS = ['❤️', '🔥', '😂'];

const formatMessage = (val, id, currentUid) => ({
  id,
  text: val.text,
  readBy: val.readBy || [],
  reactions: val.reactions || {},
  sender: val.senderId === currentUid ? 'you' : val.senderId || 'them',
  voice: !!val.voice,
  url: val.url,
  duration: val.duration,
  time: val.timestamp
    ? val.timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '',
  timestamp: val.timestamp,
});

const FadeInView = ({ children, style }) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [fade]);
  return <Animated.View style={[style, { opacity: fade }]}>{children}</Animated.View>;
};

export default function ChatMessagesList({ matchId, user }) {
  const { user: currentUser, blocked } = useUser();
  const { darkMode, theme } = useTheme();
  const styles = getStyles(theme);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [oldestDoc, setOldestDoc] = useState(null);
  const [hasEarlier, setHasEarlier] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [firstLine, setFirstLine] = useState('');
  const [firstGame, setFirstGame] = useState(null);

  const showPlaceholders = loading && messages.length === 0;

  useEffect(() => {
    setFirstLine(icebreakers[Math.floor(Math.random() * icebreakers.length)] || '');
    setFirstGame(gameList[Math.floor(Math.random() * gameList.length)] || null);
  }, []);

  useEffect(() => {
    if (!matchId || !currentUser?.uid) return;
    const ref = firebase.firestore().collection('matches').doc(matchId);
    const unsub = ref.onSnapshot((doc) => {
      const data = doc.data();
      if (data?.users && !otherUserId) {
        const other = data.users.find((u) => u !== currentUser.uid);
        setOtherUserId(other);
      }
      const other = data?.users?.find((u) => u !== currentUser.uid) || otherUserId;
      if (other && data?.typing) {
        setIsTyping(!!data.typing[other]);
      }
    });
    return unsub;
  }, [matchId, currentUser?.uid, otherUserId]);

  useEffect(() => {
    if (!matchId || !currentUser?.uid) return;
    let unsub = null;
    let isMounted = true;
    const loadInitial = async () => {
      setLoading(true);
      try {
        const { messages: fetched, lastDoc } = await chatApi.getMessages(matchId);
        const mapped = fetched.map((m) => formatMessage(m, m.id, currentUser.uid));
        if (!isMounted) return;
        setMessages(mapped);
        setHasEarlier(fetched.length === 30);
        setOldestDoc(lastDoc);
        setLoading(false);
      } catch (e) {
        console.warn('Failed to load messages', e);
        setLoading(false);
      }

      unsub = firebase
        .firestore()
        .collection('matches')
        .doc(matchId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .onSnapshot((snap) => {
          snap.docChanges().forEach((change) => {
            const val = change.doc.data();
            const msg = formatMessage(val, change.doc.id, currentUser.uid);
            if (change.type === 'added') {
              setMessages((prev) => {
                if (prev.find((m) => m.id === msg.id)) return prev;
                return [msg, ...prev];
              });
            } else if (change.type === 'modified') {
              setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
            }
            if (val.senderId !== currentUser.uid && !(val.readBy || []).includes(currentUser.uid)) {
              change.doc.ref.update({
                readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
              });
            }
          });
        });
    };

    loadInitial();
    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [matchId, currentUser?.uid]);

  const loadEarlier = async () => {
    if (loadingEarlier || !oldestDoc) return;
    setLoadingEarlier(true);
    try {
      const snap = await firebase
        .firestore()
        .collection('matches')
        .doc(matchId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .startAfter(oldestDoc)
        .limit(30)
        .get();
      const data = snap.docs.map((d) => formatMessage(d.data(), d.id, currentUser.uid));
      if (data.length > 0) {
        setOldestDoc(snap.docs[snap.docs.length - 1]);
        setMessages((prev) => [...prev, ...data]);
        setHasEarlier(data.length === 30);
      } else {
        setHasEarlier(false);
      }
    } catch (e) {
      console.warn('Failed to load earlier messages', e);
    }
    setLoadingEarlier(false);
  };

  const toggleReaction = async (msgId, emoji) => {
    const msg = messages.find((m) => m.id === msgId);
    const current = msg?.reactions?.[currentUser.uid];
    const field = `reactions.${currentUser.uid}`;
    try {
      await firebase
        .firestore()
        .collection('matches')
        .doc(matchId)
        .collection('messages')
        .doc(msgId)
        .update(current === emoji ? { [field]: firebase.firestore.FieldValue.delete() } : { [field]: emoji });
    } catch (e) {
      console.warn('Failed to update reaction', e);
    }
    setReactionTarget(null);
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'system') {
      return (
        <View style={[styles.messageRow, styles.rowCenter]}>
          <View style={[styles.message, styles.system]}>
            <Text style={styles.sender}>System</Text>
            <Text style={styles.text}>{item.text}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'you';
    const rowStyle = [styles.messageRow, isUser ? styles.rowRight : styles.rowLeft];

    const bubble = item.voice ? (
      <VoiceMessageBubble message={item} userName={user.displayName} otherUserId={otherUserId} />
    ) : (
      <View style={[styles.message, isUser ? styles.right : styles.left]}>
        <Text style={styles.sender}>{isUser ? 'You' : user.displayName}</Text>
        <Text style={styles.text}>{item.text}</Text>
        <Text style={styles.time}>{item.time}</Text>
        {isUser && <Text style={styles.readReceipt}>{item.readBy.includes(otherUserId) ? '✓✓' : '✓'}</Text>}
      </View>
    );

    return (
      <TouchableOpacity onLongPress={() => setReactionTarget(item.id)} activeOpacity={0.8} style={rowStyle}>
        {!isUser && user.image && (
          <AvatarRing
            source={user.image}
            overlay={user.avatarOverlay}
            size={32}
            isMatch
            isOnline={user.online}
            style={styles.avatar}
          />
        )}
        {bubble}
        {Object.keys(item.reactions || {}).length > 0 && (
          <FadeInView style={styles.reactionRow}>
            {Object.entries(
              Object.values(item.reactions || {}).reduce((acc, r) => {
                if (!r) return acc;
                acc[r] = (acc[r] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <Text key={emoji} style={styles.reactionEmoji}>
                {emoji}
                {count > 1 ? ` ${count}` : ''}
              </Text>
            ))}
          </FadeInView>
        )}
        {reactionTarget === item.id && (
          <FadeInView style={styles.reactionBar}>
            {REACTIONS.map((emoji, i) => (
              <TouchableOpacity key={i} onPress={() => toggleReaction(item.id, emoji)}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </FadeInView>
        )}
      </TouchableOpacity>
    );
  };

  const PlaceholderBubbles = () => {
    const widths = ['60%', '70%', '55%', '80%'];
    return (
      <View style={{ flex: 4, padding: 10 }}>
        {widths.map((w, i) => (
          <View key={i} style={[styles.messageRow, i % 2 === 0 ? styles.rowLeft : styles.rowRight]}>
            <View style={[styles.message, i % 2 === 0 ? styles.left : styles.right, { backgroundColor: darkMode ? '#444' : '#ddd', width: w, height: 20 }]} />
          </View>
        ))}
      </View>
    );
  };

  if (showPlaceholders) {
    return <PlaceholderBubbles />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingBottom: 0 }}
        inverted
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          hasEarlier ? (
            <TouchableOpacity style={{ padding: 10, alignItems: 'center' }} onPress={loadEarlier} disabled={loadingEarlier}>
              <Text style={{ color: theme.primary }}>{loadingEarlier ? 'Loading...' : 'Load earlier'}</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <EmptyState text="No messages yet." image={require('../assets/logo.png')} />
              {firstLine ? (
                <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 4 }}>{`Try: "${firstLine}"`}</Text>
              ) : null}
              {firstGame ? (
                <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 2 }}>{`Or invite them to play ${firstGame.title}`}</Text>
              ) : null}
            </View>
          )
        }
      />
      {isTyping && <Text style={styles.typingIndicator}>{user.displayName} is typing...</Text>}
    </View>
  );
}

ChatMessagesList.propTypes = {
  matchId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 10,
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginVertical: 4,
    },
    rowLeft: { justifyContent: 'flex-start' },
    rowRight: { justifyContent: 'flex-end' },
    rowCenter: { justifyContent: 'center' },
    message: {
      padding: 8,
      borderRadius: 10,
      maxWidth: '80%',
    },
    left: {
      alignSelf: 'flex-start',
      backgroundColor: '#f9f9f9',
    },
    right: {
      alignSelf: 'flex-end',
      backgroundColor: '#ffb6c1',
    },
    system: {
      alignSelf: 'center',
      backgroundColor: '#eee',
    },
    sender: {
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    text: { fontSize: 15 },
    readReceipt: { fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
    time: { fontSize: 11, color: '#666', marginTop: 4 },
    reactionRow: { flexDirection: 'row', marginTop: 4 },
    reactionEmoji: { fontSize: 16, marginRight: 6 },
    reactionBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 6, marginTop: 4 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 6 },
    typingIndicator: { fontSize: 12, color: '#666', marginBottom: 4 },
  });
