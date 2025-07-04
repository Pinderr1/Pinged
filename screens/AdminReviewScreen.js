import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import firebase from '../firebase';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import GradientButton from '../components/GradientButton';
import AvatarRing from '../components/AvatarRing';
import Loader from '../components/Loader';
import getStyles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING } from '../layout';

export default function AdminReviewScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('users')
      .where('flaggedForReview', '==', true)
      .onSnapshot((snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    return () => unsub();
  }, []);

  const approve = async (uid) => {
    await firebase.firestore().collection('users').doc(uid).update({
      flaggedForReview: false,
    });
  };

  const reject = async (uid) => {
    await firebase.firestore().collection('users').doc(uid).update({
      flaggedForReview: false,
    });
  };

  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <AvatarRing source={item.photoURL} size={60} />
        <Text style={{ marginLeft: 10, color: theme.text, fontWeight: '600' }}>
          {item.displayName || item.email}
        </Text>
      </View>
      <GradientButton text="Approve" onPress={() => approve(item.id)} />
      <GradientButton text="Reject" onPress={() => reject(item.id)} style={{ marginTop: 6 }} />
    </View>
  );

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScreenContainer style={[styles.container, { paddingTop: HEADER_SPACING }] }>
        <Header />
        <Text style={[styles.logoText, { color: theme.text, marginBottom: 20 }]}>Flagged Users</Text>
        {loading ? (
          <Loader />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={{ color: theme.textSecondary }}>No flagged users.</Text>}
          />
        )}
      </ScreenContainer>
    </GradientBackground>
  );
}

AdminReviewScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};
