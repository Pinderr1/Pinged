// /screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import SafeKeyboardView from '../components/SafeKeyboardView';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import styles from '../styles';
import { HEADER_SPACING, BUTTON_STYLE, FONT_SIZES } from '../theme';
import Header from '../components/Header';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatarAsync } from '../utils/upload';
import { avatarSource } from '../utils/avatar';
import { sanitizeText } from '../utils/sanitize';
import PropTypes from 'prop-types';

const ProfileScreen = ({ navigation, route }) => {
  const { user, updateUser } = useUser();
  const [editMode, setEditMode] = useState(route?.params?.editMode || false);
  const [name, setName] = useState(user?.displayName || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatar, setAvatar] = useState(user?.photoURL || '');

  const pickImage = async () => {
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
      setAvatar(result.assets[0].uri);
    }
  };

  useEffect(() => {
    setName(user?.displayName || '');
    setAge(user?.age ? String(user.age) : '');
    setGender(user?.gender || '');
    setBio(user?.bio || '');
    setLocation(user?.location || '');
    setAvatar(user?.photoURL || '');
  }, [user]);

  useEffect(() => {
    setEditMode(route?.params?.editMode || false);
  }, [route?.params?.editMode]);

  const handleSave = async () => {
    if (!user) return;
    let photoURL = avatar;
    if (avatar && !avatar.startsWith('http')) {
      try {
        photoURL = await uploadAvatarAsync(avatar, user.uid);
      } catch (e) {
        console.warn('Avatar upload failed', e);
        Toast.show({ type: 'error', text1: 'Failed to upload photo' });
      }
    }

    const clean = {
      displayName: sanitizeText(name.trim()),
      age: parseInt(age, 10) || null,
      gender: sanitizeText(gender),
      bio: sanitizeText(bio.trim()),
      location: sanitizeText(location),
      photoURL,
    };
    try {
      await db
        .collection('users')
        .doc(user.uid)
        .set(clean, { merge: true });
      updateUser(clean);
      setAvatar(photoURL);
      Toast.show({ type: 'success', text1: 'Profile updated!' });
      navigation.navigate('Main');
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
      <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginBottom: 10 }}>
        <Image source={avatarSource(avatar)} style={{ width: 100, height: 100, borderRadius: 50 }} />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
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
