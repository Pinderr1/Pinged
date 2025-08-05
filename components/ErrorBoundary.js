import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { logError } from '../utils/crashlytics';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error', error, info);
    const { componentName } = this.props;
    const context = componentName
      ? `${componentName}: ${info?.componentStack || ''}`
      : info?.componentStack;
    logError(error, context);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  componentName: PropTypes.string,
};
