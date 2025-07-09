// screens/PhoneVerificationScreen.js
import { useEffect, useState } from "react";
import { View, TextInput, Text } from "react-native";
import GradientBackground from "../components/GradientBackground";
import GradientButton from "../components/GradientButton";
import ScreenContainer from "../components/ScreenContainer";
import SafeKeyboardView from "../components/SafeKeyboardView";
import Header from "../components/Header";
import RNPickerSelect from "react-native-picker-select";
import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCredential,
} from "firebase/auth";
import Toast from "react-native-toast-message";
import PropTypes from "prop-types";
import { useTheme } from "../contexts/ThemeContext";
import getStyles from "../styles";
import { HEADER_SPACING } from "../layout";

const countryItems = [
  { label: "+1 USA", value: "+1" },
  { label: "+44 UK", value: "+44" },
  { label: "+61 AUS", value: "+61" },
  { label: "+81 JP", value: "+81" },
  { label: "+91 IND", value: "+91" },
];

export default function PhoneVerificationScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [lastSent, setLastSent] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth,
      );
    }
    return () => {
      window.recaptchaVerifier?.clear?.();
    };
  }, []);

  const spamNumbers = ["+11234567890"];
  const isSpammyNumber = (num) => {
    const digits = num.replace(/\D/g, "");
    const local = digits.slice(-10);
    if (spamNumbers.includes(num)) return true;
    if (/^(\d)\1{9}$/.test(local)) return true;
    if (local === "1234567890" || local === "0123456789") return true;
    return false;
  };

  const sendCode = async () => {
    const now = Date.now();
    if (now - lastSent < 30000) {
      Toast.show({
        type: "info",
        text1: "Please wait before requesting another code.",
      });
      return;
    }
    try {
      const phoneNumber = `${countryCode}${phone}`;
      if (isSpammyNumber(phoneNumber)) {
        Toast.show({ type: "error", text1: "Invalid phone number" });
        setLastSent(now);
        return;
      }
      const res = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier,
      );
      setVerificationId(res.verificationId);
      setLastSent(now);
      Toast.show({ type: "success", text1: "Code sent" });
    } catch (e) {
      console.warn("Send code failed", e);
      Toast.show({ type: "error", text1: "Failed to send code" });
    }
  };

  const verifyCode = async () => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      if (auth.currentUser) {
        await linkWithCredential(auth.currentUser, credential);
      } else {
        await signInWithCredential(auth, credential);
      }
      Toast.show({ type: "success", text1: "Phone verified" });
      navigation.goBack();
    } catch (e) {
      console.warn("Verify code failed", e);
      let message = "Invalid code";
      if (e.code === "auth/credential-already-in-use") {
        message = "Code already used";
      } else if (e.code === "auth/quota-exceeded") {
        message = "SMS quota exceeded. Try later.";
      } else if (e.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try later.";
      }
      Toast.show({ type: "error", text1: message });
    }
  };

  const showOtp = !!verificationId;

  return (
    <GradientBackground>
      <Header showLogoOnly />
      <View style={{ height: 0, width: 0 }} nativeID="recaptcha-container" />
      <SafeKeyboardView style={{ flex: 1 }}>
        <ScreenContainer
          style={{ paddingTop: HEADER_SPACING, alignItems: "center" }}
        >
        {!showOtp && (
          <View style={{ width: "100%" }}>
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
          <View style={{ width: "100%" }}>
            <Text style={{ color: theme.text, marginBottom: 10 }}>
              Enter the code sent to your phone
            </Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="Verification code"
              keyboardType="number-pad"
              contextMenuHidden
              placeholderTextColor={theme.textSecondary}
            />
            <GradientButton text="Verify" onPress={verifyCode} />
          </View>
        )}
      </ScreenContainer>
      </SafeKeyboardView>
    </GradientBackground>
  );
}

PhoneVerificationScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};
