import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import {Button} from 'react-native-paper';

interface ImagePreviewProps {
  imageUri: string;
  onRetry: () => void;
  onProceed: () => void;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUri,
  onRetry,
  onProceed,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{uri: imageUri}}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={onRetry}
          style={styles.retryButton}
          labelStyle={styles.retryButtonLabel}
          icon="camera-retake">
          Retry
        </Button>

        <Button
          mode="contained"
          onPress={onProceed}
          style={styles.proceedButton}
          labelStyle={styles.proceedButtonLabel}
          icon="check-circle">
          Proceed with Detection
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: '100%',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    gap: 12,
  },
  retryButton: {
    borderColor: '#fff',
    borderWidth: 1,
  },
  retryButtonLabel: {
    color: '#fff',
    fontSize: 16,
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
  },
  proceedButtonLabel: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ImagePreview;
