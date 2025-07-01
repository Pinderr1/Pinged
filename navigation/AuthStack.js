// navigation/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import EmailAuthScreen from '../screens/EmailAuthScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="EmailLogin"
        component={EmailAuthScreen}
        initialParams={{ mode: 'login' }}
      />
      <Stack.Screen
        name="Signup"
        component={EmailAuthScreen}
        initialParams={{ mode: 'signup' }}
      />
    </Stack.Navigator>
  );
}
