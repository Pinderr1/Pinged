// screens/PhoneVerificationScreen.js
import React, { useRef, useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import RNPickerSelect from 'react-native-picker-select';
import firebase from '../firebase';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import Toast from 'react-native-toast-message';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import getStyles from '../styles';
import { HEADER_SPACING } from '../layout';

const countryItems = [
  { label: '+1 USA', value: '+1' },
  { label: '+44 UK', value: '+44' },
  { label: '+61 AUS', value: '+61' },
  { label: '+81 JP', value: '+81' },
  { label: '+91 IND', value: '+91' },
];

export default function PhoneVerificationScreen({ navigation }) {
  const recaptchaRef = useRef(null);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);

  const sendCode = async () => {
    try {
      const phoneNumber = `${countryCode}${phone}`;
      const res = await firebase
        .auth()
        .signInWithPhoneNumber(phoneNumber, recaptchaRef.current);
      setVerificationId(res.verificationId);
      Toast.show({ type: 'success', text1: 'Code sent' });
    } catch (e) {
      console.warn('Send code failed', e);
      Toast.show({ type: 'error', text1: 'Failed to send code' });
    }
  };

  const verifyCode = async () => {
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(
        verificationId,
        otp
      );
      await firebase.auth().currentUser?.linkWithCredential(credential);
      Toast.show({ type: 'success', text1: 'Phone verified' });
      navigation.goBack();
    } catch (e) {
      console.warn('Verify code failed', e);
      Toast.show({ type: 'error', text1: 'Invalid code' });
    }
  };

  const showOtp = !!verificationId;

  return (
    <GradientBackground>
      <Header showLogoOnly />
      <FirebaseRecaptchaVerifierModal ref={recaptchaRef} firebaseConfig={firebase.app().options} />
      <ScreenContainer
        style={{ paddingTop: HEADER_SPACING, alignItems: 'center' }}
      >
        {!showOtp && (
          <View style={{ width: '100%' }}>
            <RNPickerSelect
              onValueChange={setCountryCode}
              value={countryCode}
              placeholder={{}}
              useNativeAndroidPickerStyle={false}
              style={{
                inputIOS: styles.input,
                inputAndroid: styles.input,
              }}
              items={countryItems}
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              placeholderTextColor={theme.textSecondary}
            />
            <GradientButton text="Send Code" onPress={sendCode} />
          </View>
        )}
        {showOtp && (
          <View style={{ width: '100%' }}>
            <Text style={{ color: theme.text, marginBottom: 10 }}>
              Enter the code sent to your phone
            </Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="Verification code"
              keyboardType="number-pad"
              placeholderTextColor={theme.textSecondary}
            />
            <GradientButton text="Verify" onPress={verifyCode} />
          </View>
        )}
      </ScreenContainer>
    </GradientBackground>
  );
}

PhoneVerificationScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};
