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

const mockNotifications = [
  {
    id: '1',
    text: 'Emily liked your profile!',
    action: 'View Profile'
  },
  {
    id: '2',
    text: 'Liam sent you a game invite.',
    action: 'Play'
  },
  {
    id: '3',
    text: 'You and Sarah both swiped right!',
    action: 'Say Hi'
  }
];

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleAction = (n) => {
    alert(`Action: ${n.action}`);
  };

  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
            <View key={n.id} style={local.card}>
              <Text style={local.text}>{n.text}</Text>
              <View style={local.actions}>
                <TouchableOpacity
                  style={[styles.emailBtn, { marginRight: 10 }]}
                  onPress={() => handleAction(n)}
                >
                  <Text style={styles.btnText}>{n.action}</Text>
                </TouchableOpacity>
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
