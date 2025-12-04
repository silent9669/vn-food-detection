import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';
import PermissionService from '../services/PermissionService';

type CameraScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Camera'
>;

const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const [isLoading, setIsLoading] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    checkAndRequestPermission();
  }, []);

  const checkAndRequestPermission = async () => {
    try {
      // Check if permission is already granted
      if (hasPermission) {
        setPermissionChecked(true);
        return;
      }

      // Request permission using PermissionService
      const result = await PermissionService.requestCameraPermission();

      if (result.granted) {
        // Also request using react-native-vision-camera
        await requestPermission();
        setPermissionChecked(true);
      } else {
        // Permission denied
        Alert.alert(
          'Camera Permission Required',
          'Camera access is needed to capture photos of Vietnamese food.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Try Again',
              onPress: () => checkAndRequestPermission(),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert(
        'Error',
        'Failed to request camera permission. Please try again.',
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    }
  };

  const capturePhoto = async () => {
    if (!camera.current || !device) {
      Alert.alert('Error', 'Camera is not ready. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      const photo = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: true,
      });

      // Navigate to Results screen with the photo URI
      navigation.navigate('Results', {
        imageUri: `file://${photo.path}`,
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert(
        'Capture Failed',
        'Failed to capture photo. Please try again.',
        [{text: 'OK'}],
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking permissions
  if (!permissionChecked) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  // Show error if no permission
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={checkAndRequestPermission}>
          <Text style={styles.retryButtonText}>Request Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show error if no device
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera is not available</Text>
        <Text style={styles.errorSubtext}>
          Your device may not have a camera or it's currently in use by another
          app.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.instructionText}>
            Position Vietnamese food in the frame
          </Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonOverlayText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
            onPress={capturePhoto}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: Platform.select({ios: '500', android: 'normal'}),
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: Platform.select({ios: 14, android: 12}),
    borderRadius: Platform.select({ios: 12, android: 8}),
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: Platform.select({ios: '500', android: 'normal'}),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Platform.select({ios: 20, android: 16}),
    alignItems: 'center',
    paddingTop: Platform.select({ios: 60, android: 16}), // Account for iOS notch
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: Platform.select({ios: '500', android: 'normal'}),
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: Platform.select({ios: 32, android: 24}),
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ios: 40, android: 24}), // Account for iOS home indicator
  },
  backButtonOverlay: {
    padding: 12,
    flex: 1,
  },
  backButtonOverlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: Platform.select({ios: '500', android: 'normal'}),
  },
  captureButton: {
    width: Platform.select({ios: 75, android: 70}),
    height: Platform.select({ios: 75, android: 70}),
    borderRadius: Platform.select({ios: 37.5, android: 35}),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: Platform.select({ios: 65, android: 60}),
    height: Platform.select({ios: 65, android: 60}),
    borderRadius: Platform.select({ios: 32.5, android: 30}),
    backgroundColor: '#4CAF50',
  },
  placeholder: {
    flex: 1,
  },
});

export default CameraScreen;
