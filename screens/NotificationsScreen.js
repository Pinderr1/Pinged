// /screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
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
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../contexts/UserContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);


const NotificationsScreen = ({ navigation }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(data);
    });
    return unsub;
  }, [user?.uid]);

  const handleAction = (n) => {
    if (n.action) alert(`Action: ${n.action}`);
  };

  const handleDismiss = async (id) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), {
        seen: true,
      });
    } catch (e) {
      console.warn('Failed to mark notification seen', e);
    }
  };

  return (
    <LinearGradient colors={['#fff', '#ffe6f0']} style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={local.title}>Notifications</Text>

        {notifications.length === 0 ? (
          <Text style={local.empty}>You're all caught up!</Text>
        ) : (
          notifications.map((n) => (
            <View
              key={n.id}
              style={[
                local.card,
                n.seen && { opacity: 0.6 },
              ]}
            >
              <Text style={local.text}>{n.message}</Text>
              {n.timestamp && (
                <Text style={local.time}>
                  {dayjs(n.timestamp.toDate?.() || n.timestamp).fromNow()}
                </Text>
              )}
              <View style={local.actions}>
                {n.action && (
                  <TouchableOpacity
                    style={[styles.emailBtn, { marginRight: 10 }]}
                    onPress={() => handleAction(n)}
                  >
                    <Text style={styles.btnText}>{n.action}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDismiss(n.id)}>
                  <Text style={{ color: '#d81b60', fontSize: 13 }}>Dismiss</Text>
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
  time: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
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
