import React from 'react';
import { Text } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import getStyles from '../styles';
import { HEADER_SPACING } from '../layout';
import PropTypes from 'prop-types';

const ContactUsScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <ScreenContainer style={{ paddingTop: HEADER_SPACING }}>
        <Text style={[styles.logoText, { color: theme.text }]}>Contact Us</Text>
        <Text style={{ color: theme.textSecondary }}>
          For support or feedback, email support@pingedapp.com.
        </Text>
      </ScreenContainer>
    </GradientBackground>
  );
};

ContactUsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};

export default ContactUsScreen;
