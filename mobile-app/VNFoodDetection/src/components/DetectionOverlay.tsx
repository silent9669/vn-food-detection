import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {FoodDetection} from '../types/detection';

interface DetectionOverlayProps {
  imageWidth: number;
  imageHeight: number;
  detections: FoodDetection[];
  onDetectionPress?: (detection: FoodDetection) => void;
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  imageWidth,
  imageHeight,
  detections,
  onDetectionPress,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handlePress = (detection: FoodDetection) => {
    setSelectedId(detection.id);
    onDetectionPress?.(detection);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence < 0.5) {
      return '#FFA726'; // Orange for low confidence
    } else if (confidence < 0.7) {
      return '#FFEB3B'; // Yellow for medium confidence
    } else {
      return '#4CAF50'; // Green for high confidence
    }
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <View style={styles.container}>
      {detections.map(detection => {
        const {boundingBox, dishName, confidence, id} = detection;
        const isSelected = selectedId === id;

        // Calculate absolute positions
        const left = boundingBox.x * imageWidth;
        const top = boundingBox.y * imageHeight;
        const width = boundingBox.width * imageWidth;
        const height = boundingBox.height * imageHeight;

        const borderColor = getConfidenceColor(confidence);

        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.boundingBox,
              {
                left,
                top,
                width,
                height,
                borderColor,
                borderWidth: isSelected ? 3 : 2,
                backgroundColor: isSelected
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'transparent',
              },
            ]}
            onPress={() => handlePress(detection)}
            activeOpacity={0.7}>
            <View
              style={[
                styles.labelContainer,
                {backgroundColor: borderColor},
              ]}>
              <Text style={styles.dishName} numberOfLines={1}>
                {dishName}
              </Text>
              <Text style={styles.confidence}>
                {formatConfidence(confidence)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MemoizedDetectionOverlay = React.memo(DetectionOverlay);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  boundingBox: {
    position: 'absolute',
    borderRadius: Platform.select({ios: 6, android: 4}),
  },
  labelContainer: {
    position: 'absolute',
    top: -24,
    left: 0,
    paddingHorizontal: Platform.select({ios: 10, android: 8}),
    paddingVertical: Platform.select({ios: 6, android: 4}),
    borderRadius: Platform.select({ios: 6, android: 4}),
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dishName: {
    color: '#fff',
    fontSize: Platform.select({ios: 13, android: 12}),
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    maxWidth: 150,
    marginRight: 8,
  },
  confidence: {
    color: '#fff',
    fontSize: Platform.select({ios: 12, android: 11}),
    fontWeight: '600',
  },
});

export default MemoizedDetectionOverlay;
