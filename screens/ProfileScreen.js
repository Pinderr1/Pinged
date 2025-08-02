// /screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View, Image, ScrollView, Share } from 'react-native';
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
import { uploadAvatarAsync } from '../utils/upload';
import { avatarSource } from '../utils/avatar';
import { sanitizeText } from '../utils/sanitize';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';
import MultiSelectList from '../components/MultiSelectList';
import { useTheme } from '../contexts/ThemeContext';
import { allGames } from '../data/games';
import { Ionicons } from '@expo/vector-icons';
import LocationInfoModal from '../components/LocationInfoModal';
import Loader from '../components/Loader';

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
  const [relationshipGoals, setRelationshipGoals] = useState(
    user?.relationshipGoals || ''
  );
  const [height, setHeight] = useState(user?.height || '');
  const [pronouns, setPronouns] = useState(user?.pronouns || '');
  const [zodiac, setZodiac] = useState(user?.zodiac || '');
  const [education, setEducation] = useState(user?.education || '');
  const [favoriteGames, setFavoriteGames] = useState(
    Array.isArray(user?.favoriteGames) ? user.favoriteGames : []
  );
  const [interests, setInterests] = useState(user?.interests || '');
  const [languages, setLanguages] = useState(user?.languages || '');
  const [personality, setPersonality] = useState(user?.personality || '');
  const [pets, setPets] = useState(user?.pets || '');
  const [drinking, setDrinking] = useState(user?.drinking || '');
  const [smoking, setSmoking] = useState(user?.smoking || '');
  const [workout, setWorkout] = useState(user?.workout || '');
  const defaultGameOptions = allGames.map((g) => ({ label: g.title, value: g.title }));
  const [gameOptions, setGameOptions] = useState(defaultGameOptions);
  const [avatar, setAvatar] = useState(user?.photoURL || '');
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const uri = result.assets?.[0]?.uri || result.uri;
      if (uri) setAvatar(uri);
    }
  };

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setAge(user?.age ? String(user.age) : '');
    setGender(user?.gender || '');
    setGenderPref(user?.genderPref || '');
    setBio(user?.bio || '');
    setLocation(user?.location || '');
    setRelationshipGoals(user?.relationshipGoals || '');
    setHeight(user?.height || '');
    setPronouns(user?.pronouns || '');
    setZodiac(user?.zodiac || '');
    setEducation(user?.education || '');
    setFavoriteGames(Array.isArray(user?.favoriteGames) ? user.favoriteGames : []);
    setInterests(user?.interests || '');
    setLanguages(user?.languages || '');
    setPersonality(user?.personality || '');
    setPets(user?.pets || '');
    setDrinking(user?.drinking || '');
    setSmoking(user?.smoking || '');
    setWorkout(user?.workout || '');
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
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
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
      displayName: sanitizeText(displayName.trim()),
      age: parseInt(age, 10) || null,
      gender: sanitizeText(gender),
      genderPref: sanitizeText(genderPref),
      relationshipGoals: sanitizeText(relationshipGoals.trim()),
      height: sanitizeText(height.trim()),
      pronouns: sanitizeText(pronouns.trim()),
      zodiac: sanitizeText(zodiac.trim()),
      education: sanitizeText(education.trim()),
      favoriteGames: favoriteGames.map((g) => sanitizeText(g)),
      interests: sanitizeText(interests.trim()),
      languages: sanitizeText(languages.trim()),
      personality: sanitizeText(personality.trim()),
      pets: sanitizeText(pets.trim()),
      drinking: sanitizeText(drinking.trim()),
      smoking: sanitizeText(smoking.trim()),
      workout: sanitizeText(workout.trim()),
      bio: sanitizeText(bio.trim()),
      location: sanitizeText(location),
      photoURL,
    };
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .set(clean, { merge: true });
      updateUser(clean);
      setAvatar(photoURL);
      Toast.show({ type: 'success', text1: 'Profile updated!' });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (e) {
      console.warn('Failed to update profile', e);
      Toast.show({ type: 'error', text1: 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!user) return;
    try {
      const url = `https://pinged.app/user/${user.uid}?ref=${user.uid}`;
      await Share.share({
        message: `Check out my Pinged profile: ${url}`,
        url,
      });
    } catch (e) {
      console.warn('Failed to share profile', e);
    }
  };

  const gradientColors = editMode ? ['#fff', '#ffe6f0'] : ['#fff', '#fce4ec'];
  const title = editMode ? 'Edit Your Profile' : 'Set Up Your Profile';
  const saveLabel = editMode ? 'Save Changes' : 'Save';

  return (
    <GradientBackground colors={gradientColors} style={{ flex: 1 }}>
      <Header />
      <SafeKeyboardView style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.container,
            { paddingTop: HEADER_SPACING, paddingBottom: 100 },
          ]}
        >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={styles.navBtnText}>{editMode ? 'Setup Mode' : 'Edit Mode'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} accessibilityLabel="share profile">
          <Ionicons name="share-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      <Text style={styles.logoText}>{title}</Text>

      <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginBottom: 10 }}>
        <Image source={avatarSource(avatar)} style={{ width: 100, height: 100, borderRadius: 50 }} />
      </TouchableOpacity>

      {displayName ? (
        <View style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>{displayName}</Text>
          {user?.isPremium && (
            <Text
              style={{
                marginLeft: 6,
                fontSize: 12,
                color: '#fff',
                backgroundColor: '#FFD700',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              Premium
            </Text>
          )}
        </View>
      ) : null}

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
          placeholder: { color: theme.textSecondary },
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
      <TextInput
        style={styles.input}
        placeholder="\u2764\ufe0f Relationship goals"
        value={relationshipGoals}
        onChangeText={setRelationshipGoals}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83d\udc65 Pronouns"
        value={pronouns}
        onChangeText={setPronouns}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83c\udf31 Zodiac sign"
        value={zodiac}
        onChangeText={setZodiac}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83c\udf93 Education"
        value={education}
        onChangeText={setEducation}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83d\udc65 Height"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="\u2728 Interests"
        value={interests}
        onChangeText={setInterests}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83c\udf10 Languages"
        value={languages}
        onChangeText={setLanguages}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83d\ude04 Personality"
        value={personality}
        onChangeText={setPersonality}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83d\udc31 Pets"
        value={pets}
        onChangeText={setPets}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83c\udf7a Drinking"
        value={drinking}
        onChangeText={setDrinking}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83d\udeac Smoking"
        value={smoking}
        onChangeText={setSmoking}
      />
      <TextInput
        style={styles.input}
        placeholder="\ud83c\udfcb\ufe0f\u200d\u2640\ufe0f Workout habits"
        value={workout}
        onChangeText={setWorkout}
      />
      <GradientButton
        text={saveLabel}
        onPress={handleSave}
        disabled={saving}
        icon={saving ? <Loader size="small" /> : undefined}
      />
      <LocationInfoModal
        visible={showLocationInfo}
        onClose={() => setShowLocationInfo(false)}
      />
        </ScrollView>
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
