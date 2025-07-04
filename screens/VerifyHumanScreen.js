// screens/VerifyHumanScreen.js
import React from 'react';
import { Image } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { HEADER_SPACING } from '../layout';
import { useTheme } from '../contexts/ThemeContext';
import getStyles from '../styles';
import PropTypes from 'prop-types';

export default function VerifyHumanScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <GradientBackground>
      <Header showLogoOnly />
      <ScreenContainer
        style={{ alignItems: 'center', paddingTop: HEADER_SPACING }}
      >
        <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        <GradientButton
          text="I am human"
          onPress={() => navigation.navigate('PhoneVerification')}
          marginVertical={20}
          width={200}
        />
      </ScreenContainer>
    </GradientBackground>
  );
}

VerifyHumanScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
