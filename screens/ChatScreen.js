import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useChats } from '../contexts/ChatContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { useNavigation } from '@react-navigation/native';
import { games, gameList } from '../games';
import { db, firebase } from '../firebase';
import Toast from 'react-native-toast-message';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';

export default function ChatScreen({ route }) {
  const { user } = route.params || {};
  const navigation = useNavigation();
  const { user: currentUser, addGameXP } = useUser();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { devMode } = useDev();
  const { setActiveGame, getActiveGame, getPendingInvite } = useChats();
  const { darkMode, theme } = useTheme();
  const { showNotification } = useNotification();
  if (!user) {
    return (
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={{ flex: 1 }}>
        <Header />
        <Text style={{ marginTop: 80, textAlign: 'center', color: theme.text }}>
          User not found.
        </Text>
      </LinearGradient>
    );
  }
  const prevGameIdRef = useRef(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [text, setText] = useState('');
  const [devPlayer, setDevPlayer] = useState('0');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [otherUserId, setOtherUserId] = useState(null);

  const activeGameId = getActiveGame(user.id);
  const pendingInvite = getPendingInvite(user.id);
  const [messages, setMessages] = useState([]);
  const [pc, setPc] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callActive, setCallActive] = useState(false);

  const sendChatMessage = async (msgText, sender = 'user') => {
    if (!msgText.trim()) return;
    if (!user?.id) return;
    try {
      await db
        .collection('matches')
        .doc(user.id)
        .collection('messages')
        .add({
          senderId: sender === 'system' ? 'system' : currentUser?.uid,
          text: msgText.trim(),
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      if (sender === 'user') {
        Toast.show({ type: 'success', text1: 'Message sent' });
      }
    } catch (e) {
      console.warn('Failed to send message', e);
      if (sender === 'user') {
        Toast.show({ type: 'error', text1: 'Failed to send message' });
      }
    }
  };

  const updateTyping = (state) => {
    if (!user?.id || !currentUser?.uid) return;
    db
      .collection('matches')
      .doc(user.id)
      .set({ typing: { [currentUser.uid]: state } }, { merge: true });
  };

  const handleTextChange = (val) => {
    setText(val);
    updateTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => updateTyping(false), 2000);
  };

  useEffect(() => {
    if (activeGameId && activeGameId !== prevGameIdRef.current) {
      const title = games[activeGameId].meta.title;
      showNotification(`Game started: ${title}`);
    }
    prevGameIdRef.current = activeGameId;
  }, [activeGameId]);

  useEffect(() => {
    if (!user?.id || !currentUser?.uid) return;
    const ref = db.collection('matches').doc(user.id);
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
  }, [user?.id, currentUser?.uid, otherUserId]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      updateTyping(false);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !currentUser?.uid) return;
    const msgRef = db
      .collection('matches')
      .doc(user.id)
      .collection('messages')
      .orderBy('timestamp', 'asc');
    const unsub = msgRef.onSnapshot((snap) => {
      const data = snap.docs.map((d) => {
        const val = d.data();
        if (
          val.senderId !== currentUser.uid &&
          !(val.readBy || []).includes(currentUser.uid)
        ) {
          d.ref.update({
            readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
          });
        }
        return {
          id: d.id,
          text: val.text,
          readBy: val.readBy || [],
          sender:
            val.senderId === currentUser.uid
              ? 'you'
              : val.senderId || 'them',
        };
      });
      setMessages(data.reverse());
    });
    return unsub;
  }, [user?.id, currentUser?.uid]);

  const handleSend = () => {
    if (text.trim()) {
      sendChatMessage(text);
      setText('');
      updateTyping(false);
    }
  };

  const handleGameEnd = (result) => {
    if (!result) return;
    addGameXP();
    if (result.winner !== undefined) {
      const msg = result.winner === '0' ? 'You win!' : `${user.name} wins.`;
      sendChatMessage(`Game over. ${msg}`, 'system');
    } else if (result.draw) {
      sendChatMessage('Game over. Draw.', 'system');
    }
    setActiveGame(user.id, null);
  };

  const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  const startCall = async () => {
    if (!user?.id || callActive) return;
    const callRef = db.collection('calls').doc(user.id);
    const offerCandidates = callRef.collection('offerCandidates');
    const answerCandidates = callRef.collection('answerCandidates');

    const newPc = new RTCPeerConnection(servers);
    setPc(newPc);

    const stream = await mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach((track) => newPc.addTrack(track, stream));

    const remote = new MediaStream();
    setRemoteStream(remote);
    newPc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remote.addTrack(track);
      });
    };

    const callDoc = await callRef.get();
    if (callDoc.exists && callDoc.data()?.offer && !callDoc.data()?.answer) {
      await newPc.setRemoteDescription(
        new RTCSessionDescription(callDoc.data().offer)
      );
      const answerDescription = await newPc.createAnswer();
      await newPc.setLocalDescription(answerDescription);
      await callRef.update({
        answer: {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        },
      });
      newPc.onicecandidate = (e) => {
        if (e.candidate) {
          answerCandidates.add(e.candidate.toJSON());
        }
      };
      offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            newPc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    } else {
      const offerDescription = await newPc.createOffer();
      await newPc.setLocalDescription(offerDescription);
      await callRef.set({
        offer: { type: offerDescription.type, sdp: offerDescription.sdp },
      });
      newPc.onicecandidate = (e) => {
        if (e.candidate) {
          offerCandidates.add(e.candidate.toJSON());
        }
      };
      callRef.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !newPc.currentRemoteDescription) {
          newPc.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }
      });
      answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            newPc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    }
    setCallActive(true);
  };

  const endCall = async () => {
    if (!pc) return;
    pc.close();
    setPc(null);
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallActive(false);

    const callRef = db.collection('calls').doc(user.id);
    const offerCandidates = await callRef.collection('offerCandidates').get();
    offerCandidates.forEach((c) => c.ref.delete());
    const answerCandidates = await callRef.collection('answerCandidates').get();
    answerCandidates.forEach((c) => c.ref.delete());
    callRef.delete();
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  const handleGameSelect = (gameId) => {
    const isPremiumUser = !!currentUser?.isPremium;
    if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
      setShowGameModal(false);
      navigation.navigate('PremiumPaywall');
      return;
    }
    const title = games[gameId].meta.title;
    if (activeGameId && activeGameId !== gameId) {
      sendChatMessage(`Switched game to ${title}`, 'system');
    } else if (!activeGameId) {
      sendChatMessage(`Game started: ${title}`, 'system');
      recordGamePlayed();
    }
    setActiveGame(user.id, gameId);
    setShowGameModal(false);
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        chatStyles.messageBubble,
        item.sender === 'you'
          ? chatStyles.messageRight
          : item.sender === 'system'
          ? chatStyles.messageSystem
          : chatStyles.messageLeft,
      ]}
    >
      <Text style={chatStyles.sender}>
        {item.sender === 'you'
          ? 'You'
          : item.sender === 'system'
          ? 'System'
          : user.name}
      </Text>
      <Text style={chatStyles.messageText}>{item.text}</Text>
      {item.sender === 'you' && (
        <Text style={chatStyles.readReceipt}>
          {item.readBy.includes(otherUserId) ? '✓✓' : '✓'}
        </Text>
      )}
    </View>
  );

  const renderGameOption = ({ item }) => (
    <TouchableOpacity
      style={chatStyles.gameOption}
      onPress={() => handleGameSelect(item.id)}
    >
      <Text style={chatStyles.gameOptionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const chatSection = (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={[styles.logoText, { marginBottom: 10 }]}>Chat with {user.name}</Text>
      <FlatList
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingBottom: 20 }}
        inverted
        keyboardShouldPersistTaps="handled"
      />
      {isTyping && (
        <Text style={chatStyles.typingIndicator}>{user.name} is typing...</Text>
      )}
      <View style={chatStyles.inputBar}>
        <TouchableOpacity
          style={activeGameId ? chatStyles.changeButton : chatStyles.playButton}
          onPress={() => {
            if (!currentUser?.isPremium && gamesLeft <= 0 && !devMode) {
              navigation.navigate('PremiumPaywall');
            } else {
              setShowGameModal(true);
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {activeGameId ? 'Change Game' : 'Play'}
          </Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Type a message..."
          style={chatStyles.textInput}
          value={text}
          onChangeText={handleTextChange}
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={chatStyles.sendButton} onPress={handleSend}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
      <View style={chatStyles.callControls}>
        {!callActive ? (
          <TouchableOpacity
            style={chatStyles.callButton}
            onPress={startCall}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Call</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={chatStyles.endButton}
            onPress={endCall}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>End Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const SelectedGameClient = activeGameId ? games[activeGameId].Client : null;
  const gameSection = SelectedGameClient ? (
    <View
      style={{
        flex: 1,
        padding: 10,
        borderBottomWidth: 1,
        borderColor: darkMode ? '#444' : '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {devMode && (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setDevPlayer('0')}
            style={{
              backgroundColor: devPlayer === '0' ? '#d81b60' : '#ccc',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#fff' }}>Player 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDevPlayer('1')}
            style={{
              backgroundColor: devPlayer === '1' ? '#d81b60' : '#ccc',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff' }}>Player 2</Text>
          </TouchableOpacity>
        </View>
      )}
      <SelectedGameClient
        matchID={user.id}
        playerID={devMode ? devPlayer : '0'}
        onGameEnd={handleGameEnd}
      />
    </View>
  ) : null;

  const gradientColors = [theme.gradientStart, theme.gradientEnd];

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <Header />
      <Modal
        visible={showGameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGameModal(false)}
      >
        <View style={chatStyles.modalOverlay}>
          <View style={chatStyles.modalContent}>
            <FlatList
              data={gameList}
              keyExtractor={(item) => item.id}
              renderItem={renderGameOption}
            />
            <TouchableOpacity
              style={[chatStyles.sendButton, { marginTop: 10 }]}
              onPress={() => setShowGameModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <SafeAreaView style={{ flex: 1 }}>
        <SafeKeyboardView style={{ flex: 1, paddingTop: 60 }}>
          <View style={{ flex: 1 }}>
            {gameSection}
            {chatSection}
          </View>
        </SafeKeyboardView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const chatStyles = StyleSheet.create({
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
    marginVertical: 5,
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffb6c1',
  },
  messageSystem: {
    alignSelf: 'center',
    backgroundColor: '#ddd',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
  },
  sender: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#555',
  },
  readReceipt: {
    fontSize: 10,
    color: '#555',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#ff4081',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  playButton: {
    backgroundColor: '#009688',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  changeButton: {
    backgroundColor: '#607d8b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '60%',
  },
  gameOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  gameOptionText: {
    fontSize: 16,
    color: '#333',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  callButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  endButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
});
