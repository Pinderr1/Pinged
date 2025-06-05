import React, { useState } from 'react';
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
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 48) / 2;

const ALL_EVENTS = [
  {
    id: 1,
    title: 'Truth or Dare Night',
    time: 'Friday @ 9PM',
    category: 'Flirty',
    description: 'Wild dares, real connections.',
    image: require('../assets/user2.jpg')
  },
  {
    id: 2,
    title: 'Checkers Blitz',
    time: 'Saturday @ 7PM',
    category: 'Tournaments',
    description: 'Fast 1v1 matches + Boosts.',
    image: require('../assets/user3.jpg')
  },
  {
    id: 3,
    title: 'Strip RPS',
    time: 'Sunday Night',
    category: 'Flirty',
    description: 'Spicy, bold, fun.',
    image: require('../assets/user4.jpg')
  },
  {
    id: 4,
    title: 'Tic Tac Chill',
    time: 'Tonight @ 11PM',
    category: 'Tonight',
    description: 'Relax & connect.',
    image: require('../assets/user1.jpg')
  }
];

const FILTERS = ['All', 'Tonight', 'Flirty', 'Tournaments'];

const CommunityScreen = () => {
  const { darkMode } = useTheme();
  const navigation = useNavigation();
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showHostModal, setShowHostModal] = useState(false);
  const [firstJoin, setFirstJoin] = useState(false);

  const filteredEvents = activeFilter === 'All'
    ? ALL_EVENTS
    : ALL_EVENTS.filter(e => e.category === activeFilter);

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
      <View
        key={event.id}
        style={[
          local.card,
          {
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            marginRight: idx % 2 === 0 ? 8 : 0,
            marginLeft: idx % 2 !== 0 ? 8 : 0
          }
        ]}
      >
        <Image source={event.image} style={local.image} />
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
        <TouchableOpacity
          style={[
            styles.emailBtn,
            {
              marginTop: 8,
              backgroundColor: isJoined ? '#aaa' : '#d81b60'
            }
          ]}
          onPress={() => toggleJoin(event.id)}
        >
          <Text style={styles.btnText}>{isJoined ? 'Cancel RSVP' : 'Join Event'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#121212' : '#fce4ec' }}>
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
                  backgroundColor: f === activeFilter ? '#d81b60' : '#ccc'
                }
              ]}
            >
              <Text style={{ color: '#fff', fontSize: 13 }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured */}
        <View style={[local.banner, { backgroundColor: darkMode ? '#272727' : '#fff' }]}>
          <Image source={require('../assets/user2.jpg')} style={local.bannerImage} />
          <Text style={local.bannerTitle}>🔥 Featured</Text>
          <Text style={local.bannerText}>Truth or Dare Night — Friday @ 9PM</Text>
        </View>

        {/* Event grid */}
        <View style={local.grid}>
          {filteredEvents.map((event, idx) => renderEventCard(event, idx))}
        </View>

        {/* Host your own */}
        <TouchableOpacity onPress={() => setShowHostModal(true)} style={local.hostBtn}>
          <Text style={styles.btnText}>🎤 Host Your Own Event</Text>
        </TouchableOpacity>

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
              style={local.input}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="When and where?"
              style={local.input}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Details..."
              style={[local.input, { height: 60 }]}
              multiline
              placeholderTextColor="#888"
            />
            <TouchableOpacity onPress={() => setShowHostModal(false)} style={[styles.emailBtn, { marginTop: 14 }]}>
              <Text style={styles.btnText}>Submit Event</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowHostModal(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: '#d81b60' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const local = StyleSheet.create({
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
    elevation: 3
  },
  bannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10
  },
  bannerTitle: {
    color: '#d81b60',
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
    elevation: 3
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
    color: '#d81b60',
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
  hostBtn: {
    marginTop: 20,
    marginHorizontal: 16
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

export default CommunityScreen;
