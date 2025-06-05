// /screens/EditProfileScreen.js

import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';


const EditProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('DemoUser');
  const [age, setAge] = useState('23');
  const [gender, setGender] = useState('Other');
  const [bio, setBio] = useState('Looking to vibe and play chess 🎯');
  const [location, setLocation] = useState('Toronto');

  return (
    <LinearGradient colors={['#fff', '#ffe6f0']} style={styles.container}>
        <Header />
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

      <TouchableOpacity
        style={styles.emailBtn}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.btnText}>Save Changes</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default EditProfileScreen;
