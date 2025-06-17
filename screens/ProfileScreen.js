// /screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles';
import Header from '../components/Header';
import { useUser } from '../contexts/UserContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Toast from 'react-native-toast-message';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useUser();
  const [name, setName] = useState(user?.displayName || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');

  useEffect(() => {
    setName(user?.displayName || '');
    setAge(user?.age ? String(user.age) : '');
    setGender(user?.gender || '');
    setBio(user?.bio || '');
    setLocation(user?.location || '');
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const clean = {
      displayName: name.trim(),
      age: parseInt(age, 10) || null,
      gender,
      bio: bio.trim(),
      location,
    };
    try {
      await setDoc(doc(db, 'users', user.uid), clean, { merge: true });
      updateUser(clean);
      Toast.show({ type: 'success', text1: 'Profile saved!' });
      navigation.navigate('Main', { screen: 'Home' });
    } catch (e) {
      console.warn('Failed to save profile', e);
      Toast.show({ type: 'error', text1: 'Save failed' });
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

      <TouchableOpacity style={styles.uploadBtn}>
        <Text style={styles.uploadText}>Upload Avatar (Coming Soon)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.emailBtn} onPress={handleSave}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default ProfileScreen;
