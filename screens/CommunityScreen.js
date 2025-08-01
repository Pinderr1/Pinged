import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Animated,
  Easing,
  RefreshControl
} from 'react-native';
import GradientButton from '../components/GradientButton';
import Card, { CARD_STYLE } from '../components/Card';
import EventFlyer from '../components/EventFlyer';
import ScreenContainer from '../components/ScreenContainer';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { eventImageSource } from '../utils/avatar';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import PropTypes from 'prop-types';
import { useUser } from '../contexts/UserContext';
import { useEventLimit } from '../contexts/EventLimitContext';
import firebase from '../firebase';
import { HEADER_SPACING, FONT_SIZES, BUTTON_STYLE } from '../layout';
import * as Haptics from 'expo-haptics';
import EmptyState from '../components/EmptyState';
import { FONT_FAMILY } from '../textStyles';

const EVENT_PAGE_SIZE = 10;
const FILTERS = ['All', 'Tonight', 'Flirty', 'Tournaments'];

const CommunityScreen = () => {
  const { darkMode, theme } = useTheme();
  const skeletonColor = darkMode ? '#555' : '#ddd';
  const local = getStyles(theme, skeletonColor);
  const navigation = useNavigation();
  const { user, redeemEventTicket } = useUser();
  const { eventsLeft, recordEventCreated } = useEventLimit();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [lastEventDoc, setLastEventDoc] = useState(null);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const loadingMoreEvents = useRef(false);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showHostModal, setShowHostModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [firstJoin, setFirstJoin] = useState(false);
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [optionsEvent, setOptionsEvent] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  useEffect(() => {
    if (firstJoin) {
      badgeAnim.setValue(0);
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [firstJoin, badgeAnim]);

  useEffect(() => {
    const q = firebase
      .firestore()
      .collection('events')
      .orderBy('createdAt', 'desc')
      .limit(EVENT_PAGE_SIZE);
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(data);
      setLastEventDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMoreEvents(snap.docs.length === EVENT_PAGE_SIZE);
      setLoadingEvents(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = firebase.firestore().collection('communityPosts').orderBy('createdAt', 'desc');
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(data);
      setLoadingPosts(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  const filteredEvents =
    activeFilter === 'All'
      ? events
      : events.filter((e) => e.category === activeFilter);

  const joinEvent = async (id) => {
    try {
      await firebase.functions().httpsCallable('joinEvent')({ eventId: id });
    } catch (e) {
      console.warn('Failed to join event', e);
      throw e;
    }
    if (joinedEvents.length === 0) {
      setFirstJoin(true);
      if (user?.uid && !(user.badges || []).includes('socialButterfly')) {
        try {
          await firebase
            .firestore()
            .collection('users')
            .doc(user.uid)
            .update({
              badges: firebase.firestore.FieldValue.arrayUnion('socialButterfly'),
            });
        } catch (e) {
          console.warn('Failed to award badge', e);
        }
      }
    }
    setJoinedEvents([...joinedEvents, id]);
  };

  const leaveEvent = async (id) => {
    try {
      const ref = firebase
        .firestore()
        .collection('events')
        .doc(id)
        .collection('attendees')
        .doc(user.uid);
      await ref.delete();
    } catch (e) {
      console.warn('Failed to leave event', e);
    }
    setJoinedEvents(joinedEvents.filter((e) => e !== id));
  };

  const handleJoin = (event) => {
    const isJoined = joinedEvents.includes(event.id);
    if (!isJoined && event.ticketed && !user?.isPremium && !(user.eventTickets || []).includes(event.id)) {
      Alert.alert('Ticket Required', 'Redeem a ticket or upgrade to Premium.', [
        {
          text: 'Use Ticket',
          onPress: () => {
            redeemEventTicket(event.id);
            joinEvent(event.id);
            Alert.alert('Event Joined', 'You\u2019re in! XP applied.');
          },
        },
        {
          text: 'Upgrade',
          onPress: () => navigation.navigate('Premium', { context: 'paywall' }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (isJoined) {
      leaveEvent(event.id);
      Alert.alert('RSVP Cancelled', 'You left the event.');
    } else {
      joinEvent(event.id);
      Alert.alert('Event Joined', 'You\u2019re in! XP applied.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const eventSnap = await firebase
        .firestore()
        .collection('events')
        .orderBy('createdAt', 'desc')
        .limit(EVENT_PAGE_SIZE)
        .get();
      const eventData = eventSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(eventData);
      setLastEventDoc(eventSnap.docs[eventSnap.docs.length - 1] || null);
      setHasMoreEvents(eventSnap.docs.length === EVENT_PAGE_SIZE);
      const postSnap = await firebase.firestore().collection('communityPosts').orderBy('createdAt', 'desc').get();
      const postData = postSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(postData);
    } catch (e) {
      console.warn('Failed to refresh community', e);
    }
    setLoadingEvents(false);
    setLoadingPosts(false);
    setRefreshing(false);
  };

  const loadMoreEvents = async () => {
    if (loadingMoreEvents.current || !hasMoreEvents || !lastEventDoc) return;
    loadingMoreEvents.current = true;
    try {
      const snap = await firebase
        .firestore()
        .collection('events')
        .orderBy('createdAt', 'desc')
        .startAfter(lastEventDoc)
        .limit(EVENT_PAGE_SIZE)
        .get();
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents((prev) => [...prev, ...data]);
      setLastEventDoc(snap.docs[snap.docs.length - 1] || lastEventDoc);
      setHasMoreEvents(snap.docs.length === EVENT_PAGE_SIZE);
    } catch (e) {
      console.warn('Failed to load more events', e);
    }
    loadingMoreEvents.current = false;
  };

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - 100
    ) {
      loadMoreEvents();
    }
  };

  const renderEventCard = (event) => {
    const isJoined = joinedEvents.includes(event.id);
    return (
      <EventFlyer
        key={event.id}
        event={event}
        joined={isJoined}
        onJoin={() => handleJoin(event)}
      />
    );
  };

  const renderEventSkeleton = (idx) => (
    <Card
      key={`event-skel-${idx}`}
      style={[local.flyerCard, { backgroundColor: darkMode ? '#444' : '#fff' }]}
    >
      <View style={[local.flyerImage, { backgroundColor: skeletonColor }]} />
      <View style={{ flex: 1 }}>
        <View style={[local.skelLine, { width: '70%', marginBottom: 6 }]} />
        <View style={[local.skelLine, { width: '40%', marginBottom: 6 }]} />
        <View style={[local.skelButton, { width: 80 }]} />
      </View>
    </Card>
  );

  const renderPostSkeleton = (idx) => (
    <Card
      key={`post-skel-${idx}`}
      style={[local.postCard, { backgroundColor: darkMode ? '#444' : '#fff' }]}
    >
      <View style={[local.skelLine, { width: '50%', marginBottom: 6 }]} />
      <View style={[local.skelLine, { width: '30%', marginBottom: 6 }]} />
      <View style={[local.skelLine, { width: '80%', marginBottom: 6 }]} />
      <View style={[local.skelLine, { width: '70%' }]} />
    </Card>
  );


  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#333' : '#fce4ec' }}>
      <Header />
      <SafeKeyboardView style={{ flex: 1 }}>
        <ScreenContainer
          scroll
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: HEADER_SPACING, paddingBottom: 150 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
        <Text style={local.header}>🎉 Community Board</Text>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ paddingHorizontal: 16, marginBottom: 16 }}
        >
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

        {/* Events */}
        {loadingEvents ? (
          <View style={local.flyerList}>
            {[...Array(4)].map((_, idx) => renderEventSkeleton(idx))}
          </View>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            text="No events found."
            image={require('../assets/logo.png')}
          />
        ) : (
          <View style={local.flyerList}>
            {filteredEvents.map((event) => renderEventCard(event))}
          </View>
        )}

        {/* Posts */}
        {loadingPosts ? (
          [...Array(3)].map((_, idx) => renderPostSkeleton(idx))
        ) : posts.length === 0 ? (
          <EmptyState
            text="No posts yet."
            image={require('../assets/logo.png')}
          />
        ) : (
          posts.map((p) => (
            <Card key={p.id} style={[local.postCard, { backgroundColor: darkMode ? '#444' : '#fff' }]}>
              <Text style={local.postTitle}>{p.title}</Text>
              <Text style={local.postTime}>{p.time}</Text>
              <Text style={local.postDesc}>{p.description}</Text>
            </Card>
          ))
        )}

        {/* First Join Badge */}
        {firstJoin && (
          <Animated.View
            style={[
              local.badgePopup,
              { opacity: badgeAnim, transform: [{ scale: badgeAnim }] },
            ]}
          >
            <Text style={local.badgeEmoji}>🏅</Text>
            <Text style={local.badgeTitle}>New Badge Unlocked!</Text>
            <Text style={local.badgeText}>
              You earned the “Social Butterfly” badge.
            </Text>
          </Animated.View>
        )}
      </ScreenContainer>
      </SafeKeyboardView>

      {/* Floating actions */}
      {showFabMenu && (
        <View style={local.fabMenu}>
          <GradientButton
            text="Host Event"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShowHostModal(true);
              setShowFabMenu(false);
            }}
            width={140}
            marginVertical={6}
          />
          <GradientButton
            text="New Post"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShowPostModal(true);
              setShowFabMenu(false);
            }}
            width={140}
            marginVertical={6}
          />
        </View>
      )}
      <TouchableOpacity
        style={local.fab}
        onPress={() => setShowFabMenu((v) => !v)}
      >
        <Text style={local.fabIcon}>＋</Text>
      </TouchableOpacity>

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
                if (eventsLeft <= 0) {
                  Alert.alert('Limit Reached', 'You have reached your daily event limit.');
                  return;
                }
                try {
                  await firebase
                    .functions()
                    .httpsCallable('createEvent')({
                      title: newTitle,
                      time: newTime,
                      description: newDesc,
                      category: 'Tonight',
                    });
                  recordEventCreated(true);
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
                  await firebase.firestore().collection('communityPosts').add({
                    title: postTitle,
                    time: 'Just now',
                    description: postDesc,
                    userId: user?.uid || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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

      {/* Options Modal */}
      <Modal visible={showOptionsModal} transparent animationType="fade">
        <View style={local.modalBackdrop}>
          <View style={local.modalCard}>
            <TouchableOpacity
              style={{ marginBottom: 10 }}
              onPress={() => {
                setShowOptionsModal(false);
                if (optionsEvent) {
                  navigation.navigate('EventChat', { eventId: optionsEvent.event.id });
                }
              }}
            >
              <Text style={local.modalTitle}>💬 Chat</Text>
            </TouchableOpacity>
            <GradientButton
              text={optionsEvent?.isJoined ? 'Cancel RSVP' : 'Join Event'}
              onPress={() => {
                if (optionsEvent) {
                  handleJoin(optionsEvent.event);
                }
                setShowOptionsModal(false);
              }}
              marginVertical={10}
            />
            <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
              <Text style={{ color: theme.accent }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme, skeletonColor) =>
  StyleSheet.create({
  header: {
    fontSize: FONT_SIZES.XL,
    fontFamily: FONT_FAMILY.heading,
    textAlign: 'center',
    marginVertical: 20,
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    ...CARD_STYLE,
  },
  bannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10
  },
  bannerTitle: {
    color: theme.accent,
    fontFamily: FONT_FAMILY.bold,
    fontSize: FONT_SIZES.MD
  },
  bannerText: {
    fontSize: FONT_SIZES.SM,
    color: '#555',
    fontFamily: FONT_FAMILY.regular,
  },
  flyerList: {
    paddingHorizontal: 16,
  },
  flyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...CARD_STYLE,
  },
  flyerImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  badge: {
    fontSize: FONT_SIZES.SM - 2,
    color: '#28c76f',
    marginTop: 4,
    fontFamily: FONT_FAMILY.medium,
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
    fontFamily: FONT_FAMILY.bold,
    fontSize: FONT_SIZES.MD
  },
  badgeText: {
    fontSize: FONT_SIZES.SM - 1,
    color: '#666',
    fontFamily: FONT_FAMILY.regular,
  },
  postCard: {
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    ...CARD_STYLE,
  },
  postTitle: {
    fontSize: FONT_SIZES.MD - 1,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 2
  },
  postTime: {
    fontSize: FONT_SIZES.SM - 2,
    color: theme.accent,
    marginBottom: 4
  },
  postDesc: {
    fontSize: FONT_SIZES.SM - 1,
    color: '#666',
    fontFamily: FONT_FAMILY.regular,
  },
  skelLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: skeletonColor,
  },
  skelButton: {
    height: 26,
    borderRadius: 8,
    backgroundColor: skeletonColor,
  },
  filterBtn: {
    marginRight: 10,
    paddingVertical: BUTTON_STYLE.paddingVertical,
    paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
    borderRadius: BUTTON_STYLE.borderRadius
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
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    marginBottom: 12
  },
  input: {
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    marginBottom: 10,
    fontFamily: FONT_FAMILY.regular,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 88,
    right: 20,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 8,
    elevation: 5,
  },
});

CommunityScreen.propTypes = {};

export default CommunityScreen;
