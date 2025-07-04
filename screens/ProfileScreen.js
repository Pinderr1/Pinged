// /screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeKeyboardView from '../components/SafeKeyboardView';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import getStyles from '../styles';
import { HEADER_SPACING } from '../layout';
import Header from '../components/Header';
import { useUser } from '../contexts/UserContext';
import firebase from '../firebase';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatarAsync, uploadPhotoAsync } from '../utils/upload';
import { avatarSource } from '../utils/avatar';
import { sanitizeText } from '../utils/sanitize';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';
import MultiSelectList from '../components/MultiSelectList';
import { useTheme } from '../contexts/ThemeContext';
import { allGames } from '../data/games';
import ProgressBar from '../components/ProgressBar';
import { getProfileCompletion } from '../utils/profile';

const ProfileScreen = ({ navigation, route }) => {
  const { user, updateUser } = useUser();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [editMode, setEditMode] = useState(route?.params?.editMode || false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [genderPref, setGenderPref] = useState(user?.genderPref || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [favoriteGames, setFavoriteGames] = useState(
    Array.isArray(user?.favoriteGames) ? user.favoriteGames : []
  );
  const defaultGameOptions = allGames.map((g) => ({ label: g.title, value: g.title }));
  const [gameOptions, setGameOptions] = useState(defaultGameOptions);
  const [photos, setPhotos] = useState(
    Array.isArray(user?.photos)
      ? user.photos
      : user?.photoURL
      ? [user.photoURL]
      : []
  );
  const [avatar, setAvatar] = useState(user?.photoURL || '');

  const pickPhoto = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission denied' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhotos((prev) => {
        const copy = [...prev];
        copy[index] = uri;
        return copy;
      });
      if (index === 0) setAvatar(uri);
    }
  };

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setAge(user?.age ? String(user.age) : '');
    setGender(user?.gender || '');
    setGenderPref(user?.genderPref || '');
    setBio(user?.bio || '');
    setLocation(user?.location || '');
    setFavoriteGames(Array.isArray(user?.favoriteGames) ? user.favoriteGames : []);
    setPhotos(
      Array.isArray(user?.photos)
        ? user.photos
        : user?.photoURL
        ? [user.photoURL]
        : []
    );
    setAvatar(user?.photoURL || '');
  }, [user]);

  useEffect(() => {
    setEditMode(route?.params?.editMode || false);
  }, [route?.params?.editMode]);

  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('games')
      .orderBy('title')
      .onSnapshot(
        (snap) => {
          if (!snap.empty) {
            setGameOptions(
              snap.docs.map((d) => ({ label: d.data().title, value: d.data().title }))
            );
          }
        },
        (e) => console.warn('Failed to load games', e)
      );
    return unsub;
  }, []);

  const handleSave = async () => {
    if (!user) return;
    let uploaded = [];
    for (let i = 0; i < photos.length; i++) {
      const img = photos[i];
      if (img && !img.startsWith('http')) {
        try {
          const url = await uploadPhotoAsync(img, user.uid, i);
          uploaded[i] = url;
        } catch (e) {
          console.warn('Photo upload failed', e);
        }
      } else if (img) {
        uploaded[i] = img;
      }
    }
    const photoURL = uploaded[0] || avatar;

    const clean = {
      displayName: sanitizeText(displayName.trim()),
      age: parseInt(age, 10) || null,
      gender: sanitizeText(gender),
      genderPref: sanitizeText(genderPref),
      favoriteGames: favoriteGames.map((g) => sanitizeText(g)),
      bio: sanitizeText(bio.trim()),
      location: sanitizeText(location),
      photoURL,
      photos: uploaded.filter(Boolean),
    };
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .set(clean, { merge: true });
      updateUser(clean);
      setAvatar(photoURL);
      setPhotos(uploaded.filter(Boolean));
      Toast.show({ type: 'success', text1: 'Profile updated!' });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (e) {
      console.warn('Failed to update profile', e);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const completion = getProfileCompletion({ ...user, photos });
  const gradientColors = editMode ? ['#fff', '#ffe6f0'] : ['#fff', '#fce4ec'];
  const title = editMode ? 'Edit Your Profile' : 'Set Up Your Profile';
  const saveLabel = editMode ? 'Save Changes' : 'Save';

  return (
    <GradientBackground colors={gradientColors} style={{ flex: 1 }}>
      <Header />
      <SafeKeyboardView style={[styles.container, { paddingTop: HEADER_SPACING }]}>
      <TouchableOpacity onPress={() => setEditMode(!editMode)} style={{ alignSelf: 'flex-end', marginBottom: 10 }}>
        <Text style={styles.navBtnText}>{editMode ? 'Setup Mode' : 'Edit Mode'}</Text>
      </TouchableOpacity>
      <Text style={styles.logoText}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => pickPhoto(i)}
            style={{ margin: 4 }}
          >
            <Image
              source={avatarSource(photos[i])}
              style={{ width: 80, height: 80, borderRadius: 10 }}
            />
            <Ionicons
              name="pencil"
              size={18}
              color="#fff"
              style={{ position: 'absolute', right: 4, bottom: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>
      <ProgressBar value={completion} max={100} />

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <View style={styles.genderContainer}>
        {['Male', 'Female', 'Other'].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genderButton, gender === g && styles.genderSelected]}
            onPress={() => setGender(g)}
          >
            <Text
              style={[
                styles.genderText,
                gender === g && styles.genderTextSelected
              ]}
            >
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <RNPickerSelect
        onValueChange={(val) => setGenderPref(val)}
        value={genderPref}
        placeholder={{ label: 'Preferred teammate gender', value: null }}
        useNativeAndroidPickerStyle={false}
        style={{
          inputIOS: styles.input,
          inputAndroid: styles.input,
          placeholder: { color: '#999' },
        }}
        items={[
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
          { label: 'Other', value: 'Other' },
          { label: 'Any', value: 'Any' },
        ]}
      />

      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />

      <MultiSelectList
        options={gameOptions}
        selected={favoriteGames}
        onChange={setFavoriteGames}
        theme={theme}
      />
      <GradientButton text={saveLabel} onPress={handleSave} />
      </SafeKeyboardView>
    </GradientBackground>
  );
};

ProfileScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      editMode: PropTypes.bool,
    }),
  }),
};

export default ProfileScreen;
