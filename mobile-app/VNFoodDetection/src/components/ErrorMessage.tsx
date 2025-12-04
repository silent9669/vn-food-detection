import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {Button, Card} from 'react-native-paper';

export type ErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'INVALID_IMAGE'
  | 'PROCESSING_ERROR'
  | 'NO_DETECTIONS'
  | 'UNKNOWN_ERROR';

interface ErrorMessageProps {
  errorType: ErrorType;
  errorMessage: string;
  onRetry?: () => void;
  onStartOver?: () => void;
  showRetry?: boolean;
  showStartOver?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  errorType,
  errorMessage,
  onRetry,
  onStartOver,
  showRetry = true,
  showStartOver = true,
}) => {
  const getErrorTitle = (): string => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return 'Network Error';
      case 'TIMEOUT_ERROR':
        return 'Request Timeout';
      case 'INVALID_IMAGE':
        return 'Invalid Image';
      case 'PROCESSING_ERROR':
        return 'Processing Error';
      case 'NO_DETECTIONS':
        return 'No Food Detected';
      case 'UNKNOWN_ERROR':
      default:
        return 'Error';
    }
  };

  const getErrorIcon = (): string => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return '📡';
      case 'TIMEOUT_ERROR':
        return '⏱️';
      case 'INVALID_IMAGE':
        return '🖼️';
      case 'PROCESSING_ERROR':
        return '⚠️';
      case 'NO_DETECTIONS':
        return '🔍';
      case 'UNKNOWN_ERROR':
      default:
        return '❌';
    }
  };

  const getErrorColor = (): string => {
    switch (errorType) {
      case 'NO_DETECTIONS':
        return '#FFA726'; // Orange for no detections (not critical)
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
        return '#FF9800'; // Orange for network issues
      case 'INVALID_IMAGE':
      case 'PROCESSING_ERROR':
      case 'UNKNOWN_ERROR':
      default:
        return '#F44336'; // Red for errors
    }
  };

  const errorColor = getErrorColor();

  return (
    <Card style={[styles.card, {borderLeftColor: errorColor}]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.icon}>{getErrorIcon()}</Text>
          <Text style={[styles.title, {color: errorColor}]}>
            {getErrorTitle()}
          </Text>
        </View>
        <Text style={styles.message}>{errorMessage}</Text>
        <View style={styles.buttonContainer}>
          {showRetry && onRetry && (
            <Button
              mode="outlined"
              onPress={onRetry}
              style={styles.button}
              icon="refresh">
              Retry
            </Button>
          )}
          {showStartOver && onStartOver && (
            <Button
              mode="contained"
              onPress={onStartOver}
              style={styles.button}
              icon="home">
              Start Over
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderRadius: Platform.select({ios: 16, android: 12}),
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: Platform.select({ios: 26, android: 24}),
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: Platform.select({ios: 10, android: 8}),
  },
});

export default ErrorMessage;
