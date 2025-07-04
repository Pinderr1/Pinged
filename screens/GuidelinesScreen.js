import React from 'react';
import { Text } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import ScreenContainer from '../components/ScreenContainer';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import getStyles from '../styles';
import { HEADER_SPACING } from '../layout';
import PropTypes from 'prop-types';

const GuidelinesScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <ScreenContainer style={{ paddingTop: HEADER_SPACING }}>
        <Text style={[styles.logoText, { color: theme.text }]}>Community Guidelines</Text>
        <Text style={{ color: theme.textSecondary }}>
          Be respectful and keep it fun. Violations may result in account suspension.
        </Text>
      </ScreenContainer>
    </GradientBackground>
  );
};

GuidelinesScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};

export default GuidelinesScreen;
