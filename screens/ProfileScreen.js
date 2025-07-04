// /screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
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
import { uploadPhotoAsync } from '../utils/upload';
import ProgressBar from '../components/ProgressBar';
import { profileCompletion } from '../utils/profile';
import { avatarSource } from '../utils/avatar';
import { sanitizeText } from '../utils/sanitize';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';
import MultiSelectList from '../components/MultiSelectList';
import { useTheme } from '../contexts/ThemeContext';
import { allGames } from '../data/games';
import { Ionicons } from '@expo/vector-icons';
import LocationInfoModal from '../components/LocationInfoModal';

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
    Array.isArray(user?.photos) && user.photos.length
      ? user.photos
      : [user?.photoURL || '']
  );
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const completionPct = profileCompletion({
    displayName,
    age,
    gender,
    genderPref,
    bio,
    location,
    photos,
  });

  const pickImage = async (index) => {
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
        const arr = [...prev];
        if (typeof index === 'number') {
          arr[index] = uri;
        } else if (arr.length < 6) {
          arr.push(uri);
        }
        return arr;
      });
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
      Array.isArray(user?.photos) && user.photos.length
        ? user.photos
        : [user?.photoURL || '']
    );
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
      let uri = photos[i];
      if (uri && !uri.startsWith('http')) {
        try {
          uri = await uploadPhotoAsync(uri, user.uid, i);
        } catch (e) {
          console.warn('Photo upload failed', e);
          Toast.show({ type: 'error', text1: 'Failed to upload photo' });
        }
      }
      if (uri) uploaded.push(uri);
    }
    const photoURL = uploaded[0] || '';

    const clean = {
      displayName: sanitizeText(displayName.trim()),
      age: parseInt(age, 10) || null,
      gender: sanitizeText(gender),
      genderPref: sanitizeText(genderPref),
      favoriteGames: favoriteGames.map((g) => sanitizeText(g)),
      bio: sanitizeText(bio.trim()),
      location: sanitizeText(location),
      photoURL,
      photos: uploaded,
    };
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .set(clean, { merge: true });
      updateUser(clean);
      setPhotos(uploaded);
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
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <TouchableOpacity key={i} onPress={() => pickImage(i)} style={{ margin: 4 }}>
            {photos[i] ? (
              <>
                <Image
                  source={avatarSource(photos[i])}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 12,
                    padding: 2,
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                </View>
              </>
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  backgroundColor: '#eee',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={28} color="#888" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ width: '100%', marginBottom: 20 }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 4 }}>
          Profile {completionPct}% complete
        </Text>
        <ProgressBar value={completionPct} max={100} />
      </View>

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
      <TouchableOpacity
        style={styles.infoLink}
        onPress={() => setShowLocationInfo(true)}
      >
        <Text style={styles.infoLinkText}>How is my location used?</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.accent} />
      </TouchableOpacity>

      <MultiSelectList
        options={gameOptions}
        selected={favoriteGames}
        onChange={setFavoriteGames}
        theme={theme}
      />
      <GradientButton text={saveLabel} onPress={handleSave} />
      <LocationInfoModal
        visible={showLocationInfo}
        onClose={() => setShowLocationInfo(false)}
      />
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
