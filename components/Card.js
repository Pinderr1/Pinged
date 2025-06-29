import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

const Card = ({ children, style, onPress, ...rest }) => {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={[styles.card, style]} onPress={onPress} {...rest}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Card;
