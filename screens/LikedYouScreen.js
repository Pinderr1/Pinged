import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import PropTypes from 'prop-types';

const LikedYouScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.isPremium) {
      navigation.replace('Premium', { context: 'paywall' });
    }
  }, [user?.isPremium]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = firebase
      .firestore()
      .collection('likes')
      .doc(user.uid)
      .collection('likedBy')
      .onSnapshot(async (snap) => {
        const tasks = snap.docs.map((d) =>
          firebase.firestore().collection('users').doc(d.id).get()
        );
        const res = await Promise.all(tasks);
        const data = res.map((r) => ({ id: r.id, ...r.data() }));
        setUsers(data);
        setLoading(false);
      });
    return () => unsub && unsub();
  }, [user?.uid]);

  const renderItem = ({ item }) => (
    <Card style={[styles.card, { backgroundColor: theme.card }]}> 
      <View style={styles.row}>
        <AvatarRing source={item.photoURL} size={48} style={{ marginRight: 12 }} />
        <View>
          <Text style={[styles.name, { color: theme.text }]}>{item.displayName || 'User'}</Text>
          {item.age ? (
            <Text style={[styles.age, { color: theme.textSecondary }]}>{item.age}</Text>
          ) : null}
        </View>
      </View>
    </Card>
  );

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer>
        <Header />
        <View style={[styles.container, { paddingTop: HEADER_SPACING }]}>
          <Text style={[styles.title, { color: theme.text }]}>People Who Liked You</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 20 }}
            ListEmptyComponent={!loading && <EmptyState text="No likes yet" />}
          />
        </View>
      </ScreenContainer>
    </GradientBackground>
  );
};

LikedYouScreen.propTypes = {
  navigation: PropTypes.shape({ replace: PropTypes.func.isRequired }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  age: {
    fontSize: 14,
  },
});

export default LikedYouScreen;
