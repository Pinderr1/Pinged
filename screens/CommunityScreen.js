import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';
import GradientButton from '../components/GradientButton';
import Card from '../components/Card';
import { eventImageSource } from '../utils/avatar';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import PropTypes from 'prop-types';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { SAMPLE_EVENTS, SAMPLE_POSTS } from '../data/community';

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 48) / 2;


const FILTERS = ['All', 'Tonight', 'Flirty', 'Tournaments'];

const CommunityScreen = () => {
  const { darkMode, theme } = useTheme();
  const local = getStyles(theme);
  const navigation = useNavigation();
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showHostModal, setShowHostModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [firstJoin, setFirstJoin] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [posts, setPosts] = useState([]);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');

  useEffect(() => {
    const q = db.collection('events').orderBy('createdAt', 'desc');
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(data.length ? data : SAMPLE_EVENTS);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = db.collection('communityPosts').orderBy('createdAt', 'desc');
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(data.length ? data : SAMPLE_POSTS);
    });
    return unsub;
  }, []);

  const filteredEvents = activeFilter === 'All'
    ? events
    : events.filter((e) => e.category === activeFilter);

  const toggleJoin = (id) => {
    const isJoined = joinedEvents.includes(id);
    if (!isJoined && joinedEvents.length === 0) setFirstJoin(true);
    setJoinedEvents(isJoined ? joinedEvents.filter(e => e !== id) : [...joinedEvents, id]);
    Alert.alert(
      isJoined ? 'RSVP Cancelled' : 'Event Joined',
      isJoined ? 'You left the event.' : 'You’re in! XP applied.'
    );
  };

  const renderEventCard = (event, idx) => {
    const isJoined = joinedEvents.includes(event.id);
    return (
      <Card
        key={event.id}
        style={[
          local.card,
          {
            backgroundColor: darkMode ? '#444' : '#fff',
            marginRight: idx % 2 === 0 ? 8 : 0,
            marginLeft: idx % 2 !== 0 ? 8 : 0
          }
        ]}
      >
        <Image source={eventImageSource(event.image)} style={local.image} />
        <Text style={local.title}>{event.title}</Text>
        <Text style={local.time}>{event.time}</Text>
        <Text style={local.desc}>{event.description}</Text>
        <TouchableOpacity
          style={local.chatBtn}
          onPress={() => navigation.navigate('EventChat', { event })}
        >
          <Text style={local.chatText}>💬 Chat</Text>
        </TouchableOpacity>
        {isJoined && (
          <Text style={local.badge}>🎯 Joined • +10 XP</Text>
        )}
        <GradientButton
          text={isJoined ? 'Cancel RSVP' : 'Join Event'}
          onPress={() => toggleJoin(event.id)}
          marginVertical={8}
        />
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#333' : '#fce4ec' }}>
      <Header />

      <ScrollView contentContainerStyle={{ paddingTop: 100, paddingBottom: 150 }}>
        <Text style={local.header}>🎉 Community Board</Text>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveFilter(f)}
              style={[
                local.filterBtn,
                {
                  backgroundColor: f === activeFilter ? theme.accent : '#ccc'
                }
              ]}
            >
              <Text style={{ color: '#fff', fontSize: 13 }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured */}
        <Card style={[local.banner, { backgroundColor: darkMode ? '#333' : '#fff' }]}>
          <Image source={eventImageSource(require('../assets/user2.jpg'))} style={local.bannerImage} />
          <Text style={local.bannerTitle}>🔥 Featured</Text>
          <Text style={local.bannerText}>Truth or Dare Night — Friday @ 9PM</Text>
        </Card>

        {/* Event grid */}
        <View style={local.grid}>
          {filteredEvents.map((event, idx) => renderEventCard(event, idx))}
        </View>

        {/* Host your own */}
        <GradientButton
          text="Host Your Own Event"
          onPress={() => setShowHostModal(true)}
          marginVertical={20}
          icon={<Text style={{ fontSize: 16 }}>🎤</Text>}
          style={{ marginHorizontal: 16 }}
        />

        {/* Create Post */}
        <GradientButton
          text="New Post"
          onPress={() => setShowPostModal(true)}
          marginVertical={20}
          icon={<Text style={{ fontSize: 16 }}>✏️</Text>}
          style={{ marginHorizontal: 16 }}
        />

        {/* Posts */}
        {posts.map((p) => (
          <Card key={p.id} style={[local.postCard, { backgroundColor: darkMode ? '#444' : '#fff' }]}>
            <Text style={local.postTitle}>{p.title}</Text>
            <Text style={local.postTime}>{p.time}</Text>
            <Text style={local.postDesc}>{p.description}</Text>
          </Card>
        ))}

        {/* First Join Badge */}
        {firstJoin && (
          <View style={local.badgePopup}>
            <Text style={local.badgeEmoji}>🏅</Text>
            <Text style={local.badgeTitle}>New Badge Unlocked!</Text>
            <Text style={local.badgeText}>You earned the “Social Butterfly” badge.</Text>
          </View>
        )}
      </ScrollView>

      {/* Host Modal */}
      <Modal visible={showHostModal} transparent animationType="fade">
        <View style={local.modalBackdrop}>
          <View style={local.modalCard}>
            <Text style={local.modalTitle}>Host an Event</Text>
            <TextInput
              placeholder="Event Title"
              value={newTitle}
              onChangeText={setNewTitle}
              style={local.input}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="When and where?"
              value={newTime}
              onChangeText={setNewTime}
              style={local.input}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Details..."
              value={newDesc}
              onChangeText={setNewDesc}
              style={[local.input, { height: 60 }]}
              multiline
              placeholderTextColor="#888"
            />
            <GradientButton
              text="Submit Event"
              onPress={async () => {
                try {
                  await db.collection('events').add({
                    title: newTitle,
                    time: newTime,
                    description: newDesc,
                    category: 'Tonight',
                    hostId: user?.uid || null,
                    createdAt: serverTimestamp(),
                  });
                  setShowHostModal(false);
                  setNewTitle('');
                  setNewTime('');
                  setNewDesc('');
                } catch (e) {
                  Alert.alert('Error', 'Failed to create event');
                }
              }}
              marginVertical={14}
            />
            <TouchableOpacity onPress={() => setShowHostModal(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: theme.accent }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Post Modal */}
      <Modal visible={showPostModal} transparent animationType="fade">
        <View style={local.modalBackdrop}>
          <View style={local.modalCard}>
            <Text style={local.modalTitle}>Create Post</Text>
            <TextInput
              placeholder="Title"
              value={postTitle}
              onChangeText={setPostTitle}
              style={local.input}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Details..."
              value={postDesc}
              onChangeText={setPostDesc}
              style={[local.input, { height: 60 }]}
              multiline
              placeholderTextColor="#888"
            />
            <GradientButton
              text="Submit Post"
              onPress={async () => {
                try {
                  await db.collection('communityPosts').add({
                    title: postTitle,
                    time: 'Just now',
                    description: postDesc,
                    userId: user?.uid || null,
                    createdAt: serverTimestamp(),
                  });
                  setShowPostModal(false);
                  setPostTitle('');
                  setPostDesc('');
                } catch (e) {
                  Alert.alert('Error', 'Failed to create post');
                }
              }}
              marginVertical={14}
            />
            <TouchableOpacity onPress={() => setShowPostModal(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: theme.accent }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    
  },
  bannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10
  },
  bannerTitle: {
    color: theme.accent,
    fontWeight: 'bold',
    fontSize: 16
  },
  bannerText: {
    fontSize: 14,
    color: '#555'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  card: {
    width: cardWidth,
    borderRadius: 16,
    marginBottom: 20,
    padding: 12,
    
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 6
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  time: {
    fontSize: 12,
    color: theme.accent,
    marginBottom: 2
  },
  desc: {
    fontSize: 12,
    color: '#666'
  },
  chatBtn: {
    marginTop: 6
  },
  chatText: {
    fontSize: 12,
    color: '#4287f5'
  },
  badge: {
    fontSize: 12,
    color: '#28c76f',
    marginTop: 4
  },
  badgePopup: {
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5
  },
  badgeEmoji: {
    fontSize: 30,
    marginBottom: 6
  },
  badgeTitle: {
    fontWeight: 'bold',
    fontSize: 16
  },
  badgeText: {
    fontSize: 13,
    color: '#666'
  },
  postCard: {
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    
  },
  postTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2
  },
  postTime: {
    fontSize: 12,
    color: theme.accent,
    marginBottom: 4
  },
  postDesc: {
    fontSize: 13,
    color: '#666'
  },
  filterBtn: {
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCard: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 10
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12
  },
  input: {
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    marginBottom: 10
  }
});

CommunityScreen.propTypes = {};

export default CommunityScreen;
