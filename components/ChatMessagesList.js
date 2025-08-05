import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';
import firebase from '../firebase';
import AvatarRing from './AvatarRing';
import VoiceMessageBubble from './VoiceMessageBubble';
import EmptyState from './EmptyState';
import Loader from './Loader';
import { gameList } from '../games';
import { icebreakers } from '../data/prompts';
import { useChatApi } from '../utils/chatApi';
import { useEncryption } from '../contexts/EncryptionContext';

const REACTIONS = ['❤️', '🔥', '😂'];

const FadeInView = ({ children, style }) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [fade]);
  return <Animated.View style={[style, { opacity: fade }]}>{children}</Animated.View>;
};

export default function ChatMessagesList({ matchId, user, currentUser, theme, darkMode }) {
  const styles = getStyles(theme);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [oldestDoc, setOldestDoc] = useState(null);
  const [fromArchive, setFromArchive] = useState(false);
  const [oldestArchiveDoc, setOldestArchiveDoc] = useState(null);
  const [hasEarlier, setHasEarlier] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [firstLine, setFirstLine] = useState('');
  const [firstGame, setFirstGame] = useState(null);

  const showPlaceholders = loading && messages.length === 0;

  const { decryptText } = useEncryption();
  const { getMessages } = useChatApi();

  const formatMessage = async (val, id, currentUid) => {
    let text = val.text;
    if (!text && val.ciphertext && val.nonce && val.senderId) {
      try {
        text = await decryptText(val.ciphertext, val.nonce, val.senderId);
      } catch (e) {
        text = '';
      }
    }
    return {
      id,
      text,
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
    };
  };

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
      if (other && data?.typingIndicator) {
        setIsTyping(!!data.typingIndicator[other]);
      }
    });
    return unsub;
  }, [matchId, currentUser?.uid, otherUserId]);

  useEffect(() => {
    if (!matchId || !currentUser?.uid) return;
    let isMounted = true;
    const ref = firebase
      .firestore()
      .collection('matches')
      .doc(matchId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(1);
    const unsubscribe = ref.onSnapshot((snap) => {
      snap.docChanges().forEach(async (change) => {
        const val = change.doc.data();
        const msg = await formatMessage(val, change.doc.id, currentUser.uid);
        if (change.type === 'added') {
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [msg, ...prev];
          });
        } else if (change.type === 'modified') {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        }
        if (
          val.senderId !== currentUser.uid &&
          !(val.readBy || []).includes(currentUser.uid)
        ) {
          change.doc.ref.update({
            readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
          });
        }
      });
    });

    const loadInitial = async () => {
      setFromArchive(false);
      setOldestArchiveDoc(null);
      setOldestDoc(null);
      setLoading(true);
      try {
        const { messages: fetched, lastDoc } = await getMessages(
          matchId,
          currentUser.uid,
        );
        const mapped = await Promise.all(
          fetched.map((m) => formatMessage(m, m.id, currentUser.uid)),
        );
        if (!isMounted) return;
        setMessages(mapped);
        setHasEarlier(fetched.length === 30);
        setOldestDoc(lastDoc);
        setLoading(false);
      } catch (e) {
        console.warn('Failed to load messages', e);
        setLoading(false);
      }
    };

    loadInitial();
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [matchId, currentUser?.uid]);

  const loadEarlier = async () => {
    if (loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      if (fromArchive) {
        const { messages: fetched, lastDoc } = await getMessages(
          matchId,
          currentUser.uid,
          oldestArchiveDoc,
          30,
          true,
        );
        const data = await Promise.all(
          fetched.map((d) => formatMessage(d, d.id, currentUser.uid)),
        );
        if (data.length > 0) {
          setOldestArchiveDoc(lastDoc);
          setMessages((prev) => [...prev, ...data]);
          setHasEarlier(data.length === 30);
        } else {
          setHasEarlier(false);
        }
      } else {
        const { messages: fetched, lastDoc } = await getMessages(
          matchId,
          currentUser.uid,
          oldestDoc,
        );
        const data = await Promise.all(
          fetched.map((d) => formatMessage(d, d.id, currentUser.uid)),
        );
        if (data.length > 0) {
          setOldestDoc(lastDoc);
          setMessages((prev) => [...prev, ...data]);
          setHasEarlier(data.length === 30);
        } else {
          setFromArchive(true);
          const { messages: archFetched, lastDoc: archLast } =
            await getMessages(matchId, currentUser.uid, null, 30, true);
          const archData = await Promise.all(
            archFetched.map((d) => formatMessage(d, d.id, currentUser.uid)),
          );
          if (archData.length > 0) {
            setOldestArchiveDoc(archLast);
            setMessages((prev) => [...prev, ...archData]);
            setHasEarlier(archData.length === 30);
          } else {
            setHasEarlier(false);
          }
        }
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
                <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 2 }}>{`Or invite them to play ${firstGame.name}`}</Text>
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
  currentUser: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  darkMode: PropTypes.bool,
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
