import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Text,
  Alert,
  Platform,
} from 'react-native';
import {Button, Card} from 'react-native-paper';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import {RootStackParamList} from '../types/navigation';
import {DetectionResult} from '../types/detection';
import ApiClient from '../services/ApiClient';
import ImageProcessor from '../services/ImageProcessor';
import DetectionOverlay from '../components/DetectionOverlay';
import NutritionCard from '../components/NutritionCard';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorMessage, {ErrorType} from '../components/ErrorMessage';
import {calculateNutritionFromDetections} from '../utils/nutritionCalculator';

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;
type ResultsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Results'
>;

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const ResultsScreen: React.FC = () => {
  const route = useRoute<ResultsScreenRouteProp>();
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const {imageUri} = route.params;

  const [loading, setLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: SCREEN_WIDTH - 32,
    height: 300,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    // Get image dimensions
    loadImageDimensions();
    // Trigger detection when component mounts
    performDetection();
  }, [imageUri]);

  const loadImageDimensions = async () => {
    try {
      const dimensions = await ImageProcessor.getImageDimensions(imageUri);
      setImageDimensions(dimensions);
    } catch (err) {
      console.error('Failed to get image dimensions:', err);
      // Use default dimensions if failed
    }
  };

  const performDetection = async () => {
    // Prevent duplicate submissions
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      setError(null);
      setDetectionResult(null);

      // Initialize API client
      const apiClient = new ApiClient();

      // Process image for upload
      const base64Image = await ImageProcessor.convertToBase64(imageUri);

      // Call detection API
      const response = await apiClient.detectFood({
        image: base64Image,
      });

      // Check if detection was successful
      if (response.success && response.data) {
        setDetectionResult(response.data);
      } else {
        throw new Error(response.message || 'Detection failed');
      }
    } catch (err) {
      console.error('Detection error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to detect food items';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    // Clear error state before retrying
    setError(null);
    setDetectionResult(null);
    performDetection();
  };

  const handleStartOver = () => {
    // Clear all state before navigating
    setDetectionResult(null);
    setError(null);
    setLoading(false);
    setIsProcessing(false);
    navigation.navigate('Home');
  };

  const handleShare = async () => {
    if (!detectionResult || detectionResult.detections.length === 0) {
      Alert.alert('No Results', 'There are no detection results to share.');
      return;
    }

    if (isSharing) {
      return;
    }

    try {
      setIsSharing(true);

      // Capture screenshot of results view
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();

        // Prepare share message
        const detectionCount = detectionResult.detections.length;
        const dishNames = detectionResult.detections
          .map(d => d.dish_name)
          .join(', ');
        
        const message = `Vietnamese Food Detection Results\n\nDetected ${detectionCount} item(s): ${dishNames}\n\nShared from VN Food Detection App`;

        // Share screenshot with message
        await Share.open({
          title: 'Share Detection Results',
          message: message,
          url: `file://${uri}`,
          type: 'image/png',
        });
      }
    } catch (err: any) {
      // User cancelled share or error occurred
      if (err && err.message && !err.message.includes('User did not share')) {
        console.error('Share error:', err);
        Alert.alert('Share Failed', 'Failed to share results. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Memoize expensive nutrition calculations
  const nutritionData = useMemo(() => {
    if (!detectionResult || detectionResult.detections.length === 0) {
      return null;
    }
    return calculateNutritionFromDetections(detectionResult.detections);
  }, [detectionResult]);

  const getErrorType = (errorMsg: string): ErrorType => {
    const lowerMsg = errorMsg.toLowerCase();
    if (lowerMsg.includes('network') || lowerMsg.includes('connection')) {
      return 'NETWORK_ERROR';
    } else if (lowerMsg.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    } else if (lowerMsg.includes('invalid') || lowerMsg.includes('format')) {
      return 'INVALID_IMAGE';
    } else if (lowerMsg.includes('no') && lowerMsg.includes('detect')) {
      return 'NO_DETECTIONS';
    } else if (lowerMsg.includes('processing')) {
      return 'PROCESSING_ERROR';
    }
    return 'UNKNOWN_ERROR';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ViewShot ref={viewShotRef} options={{format: 'png', quality: 0.9}}>
      {/* Display selected image with detection overlay */}
      <Card style={styles.imageCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{uri: imageUri}}
            style={[
              styles.image,
              {width: imageDimensions.width, height: imageDimensions.height},
            ]}
            resizeMode="contain"
          />
          {detectionResult && detectionResult.detections.length > 0 && (
            <View
              style={[
                styles.overlayContainer,
                {width: imageDimensions.width, height: imageDimensions.height},
              ]}>
              <DetectionOverlay
                imageWidth={imageDimensions.width}
                imageHeight={imageDimensions.height}
                detections={detectionResult.detections}
              />
            </View>
          )}
        </View>
      </Card>

      {/* Loading indicator */}
      {loading && (
        <LoadingIndicator message="Detecting food items..." />
      )}

      {/* Error message */}
      {error && (
        <ErrorMessage
          errorType={getErrorType(error)}
          errorMessage={error}
          onRetry={handleRetry}
          onStartOver={handleStartOver}
          showRetry={!isProcessing}
          showStartOver={!isProcessing}
        />
      )}

      {/* Detection results summary */}
      {detectionResult && detectionResult.detections.length > 0 && (
        <>
          <Card style={styles.resultsCard}>
            <Card.Content>
              <Text style={styles.resultsTitle}>Detection Results</Text>
              <Text style={styles.resultsText}>
                Found {detectionResult.detections.length} food item(s)
              </Text>
              <Text style={styles.processingTime}>
                Processing time: {detectionResult.processingTime.toFixed(2)}s
              </Text>
            </Card.Content>
          </Card>

          {/* Nutrition information */}
          {nutritionData && nutritionData.items.length > 0 && (
            <NutritionCard
              totalNutrition={nutritionData.total}
              items={nutritionData.items}
            />
          )}
        </>
      )}

      {/* No detections message */}
      {detectionResult && detectionResult.detections.length === 0 && (
        <Card style={styles.noResultsCard}>
          <Card.Content>
            <Text style={styles.noResultsTitle}>No Food Detected</Text>
            <Text style={styles.noResultsText}>
              We couldn't detect any Vietnamese food items in this image. Please try
              again with a clearer photo.
            </Text>
          </Card.Content>
        </Card>
      )}
      </ViewShot>

      {/* Action buttons */}
      {!loading && (
        <View style={styles.actionButtons}>
          {detectionResult && detectionResult.detections.length > 0 && (
            <Button
              mode="contained"
              onPress={handleShare}
              style={[
                styles.actionButton,
                styles.shareButton,
                (isProcessing || isSharing) && styles.disabledButton,
              ]}
              disabled={isProcessing || isSharing}
              icon="share-variant"
              loading={isSharing}>
              {isSharing ? 'Sharing...' : 'Share Results'}
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={handleStartOver}
            style={[
              styles.actionButton,
              isProcessing && styles.disabledButton,
            ]}
            disabled={isProcessing}
            icon="home">
            Start Over
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  imageCard: {
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderRadius: Platform.select({ios: 16, android: 12}),
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#000',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  resultsCard: {
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderRadius: Platform.select({ios: 16, android: 12}),
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    color: '#4CAF50',
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  processingTime: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  noResultsCard: {
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        backgroundColor: '#FFF3E0',
      },
      android: {
        elevation: 4,
        backgroundColor: '#FFF3E0',
      },
    }),
    borderRadius: Platform.select({ios: 16, android: 12}),
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    color: '#F57C00',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#E65100',
    lineHeight: 24,
  },
  actionButtons: {
    marginTop: 16,
    marginBottom: Platform.select({ios: 32, android: 24}),
  },
  actionButton: {
    borderRadius: Platform.select({ios: 12, android: 8}),
    marginBottom: 12,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ResultsScreen;
