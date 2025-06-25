// /screens/EditProfileScreen.js

import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { db, firebase } from '../firebase';
import { useUser } from '../contexts/UserContext';


const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useUser();
  const [name, setName] = useState(user?.displayName || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || 'Other');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');

  useEffect(() => {
    setName(user?.displayName || '');
    setAge(user?.age ? String(user.age) : '');
    setGender(user?.gender || 'Other');
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
      await db
        .collection('users')
        .doc(user.uid)
        .set(clean, { merge: true });
      updateUser(clean);
      navigation.navigate('Main');
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  };

  return (
    <LinearGradient colors={['#fff', '#ffe6f0']} style={{ flex: 1 }}>
      <Header />
      <SafeKeyboardView style={[styles.container, { paddingTop: 60 }]}>
        <Text style={styles.logoText}>Edit Your Profile</Text>

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

      <TouchableOpacity style={styles.emailBtn} onPress={handleSave}>
        <Text style={styles.btnText}>Save Changes</Text>
      </TouchableOpacity>
      </SafeKeyboardView>
    </LinearGradient>
  );
};

export default EditProfileScreen;
