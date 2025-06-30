import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const Card = ({ children, style, onPress, ...rest }) => {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={[styles.card, style]} onPress={onPress} {...rest}>
      {children}
    </Container>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onPress: PropTypes.func,
};

export const CARD_STYLE = {
  borderRadius: 16,
  padding: 16,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 3,
};

const styles = StyleSheet.create({
  card: CARD_STYLE,
});

export default Card;
