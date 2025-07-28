import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import getStyles from '../styles';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import Card from '../components/Card';
import AvatarRing from '../components/AvatarRing';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebase from '../firebase';
import { HEADER_SPACING } from '../layout';

const BlockedUsersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const globalStyles = getStyles(theme);
  const { blocked } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!blocked || !blocked.length) {
          if (active) setUsers([]);
        } else {
          const tasks = blocked.map((uid) =>
            firebase.firestore().collection('users').doc(uid).get()
          );
          const res = await Promise.all(tasks);
          if (active) setUsers(res.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (e) {
        console.warn('Failed to load blocked users', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchUsers();
    return () => {
      active = false;
    };
  }, [blocked]);

  const handleUnblock = async (uid) => {
    if (!uid) return;
    try {
      await firebase.functions().httpsCallable('unblockUser')({ targetUid: uid });
    } catch (e) {
      console.warn('Failed to unblock user', e);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.row}>
        <View style={styles.rowInfo}>
          <AvatarRing
            source={item.photoURL}
            overlay={item.avatarOverlay}
            size={48}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.name, { color: theme.text }]}>{item.displayName || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => handleUnblock(item.id)}>
          <Text style={[styles.unblock, { color: theme.accent }]}>Unblock</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer>
        <Header />
        <View style={[globalStyles.container, { paddingTop: HEADER_SPACING }]}>
          <Text style={[styles.title, { color: theme.text }]}>Blocked Users</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 20 }}
            ListEmptyComponent={!loading && <EmptyState text="No blocked users" />}
          />
        </View>
      </ScreenContainer>
    </GradientBackground>
  );
};

BlockedUsersScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func }).isRequired,
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  unblock: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BlockedUsersScreen;
