// /screens/ProfileScreen.js

import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import { useUser } from '../contexts/UserContext';
import { avatarSource } from '../utils/avatar';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles';
import Header from '../components/Header';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useUser();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState(user?.photoURL || '');

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await uploadAvatar(uri);
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const response = await fetch(uri);
      const blob = await response.blob();
      const avatarRef = ref(storage, `avatars/${uid}.jpg`);
      await uploadBytes(avatarRef, blob);
      const url = await getDownloadURL(avatarRef);
      await setDoc(doc(db, 'users', uid), { photoURL: url }, { merge: true });
      updateUser({ photoURL: url });
    } catch (e) {
      console.warn('Avatar upload failed', e);
    }
  };

  return (
    <LinearGradient colors={['#fff', '#fce4ec']} style={styles.container}>
      <Header />
      <Text style={styles.logoText}>Set Up Your Profile</Text>

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

      <TouchableOpacity style={styles.uploadBtn} onPress={pickAvatar}>
        <Image source={avatarSource(avatar)} style={{ width: 120, height: 120, borderRadius: 60 }} />
        <Text style={styles.uploadText}>Tap to change avatar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.emailBtn}
        onPress={() => navigation.navigate('Main', { screen: 'Home' })}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default ProfileScreen;
