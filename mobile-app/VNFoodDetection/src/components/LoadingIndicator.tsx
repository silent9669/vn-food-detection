import React from 'react';
import {View, StyleSheet, ActivityIndicator, Text, Animated, Platform} from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  progress = 0,
  showProgress = false,
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.message}>{message}</Text>
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, {width: progressWidth}]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Platform.select({ios: 40, android: 32}),
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: Platform.select({ios: '500', android: 'normal'}),
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: Platform.select({ios: 6, android: 8}),
    backgroundColor: '#E0E0E0',
    borderRadius: Platform.select({ios: 3, android: 4}),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: Platform.select({ios: 3, android: 4}),
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});

export default LoadingIndicator;
