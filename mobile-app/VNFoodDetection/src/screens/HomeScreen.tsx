import React, {useState} from 'react';
import {View, StyleSheet, Alert, Platform} from 'react-native';
import {Button, Title, Paragraph, Card} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import ImagePickerService from '../services/ImagePickerService';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isPickingImage, setIsPickingImage] = useState(false);

  const handleCameraPress = () => {
    navigation.navigate('Camera');
  };

  const handleGalleryPress = async () => {
    try {
      setIsPickingImage(true);
      const result = await ImagePickerService.pickImageFromGallery();

      if (result.success && result.imageUri) {
        // Navigate to Results screen with the selected image
        navigation.navigate('Results', {imageUri: result.imageUri});
      } else if (result.cancelled) {
        // User cancelled, do nothing
        console.log('Image selection cancelled');
      } else if (result.error) {
        // Show error alert
        Alert.alert('Error', result.error, [{text: 'OK'}]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.', [
        {text: 'OK'},
      ]);
    } finally {
      setIsPickingImage(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.title}>🍜 Vietnamese Food Detection</Title>
            <Paragraph style={styles.subtitle}>
              Detect and identify Vietnamese dishes with nutritional information
            </Paragraph>
          </View>

          <View style={styles.instructions}>
            <Paragraph style={styles.instructionText}>
              Take a photo or select from gallery to get started
            </Paragraph>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleCameraPress}
              style={styles.button}
              icon="camera"
              contentStyle={styles.buttonContent}>
              Take Photo
            </Button>

            <Button
              mode="outlined"
              onPress={handleGalleryPress}
              style={styles.button}
              icon="image"
              contentStyle={styles.buttonContent}
              loading={isPickingImage}
              disabled={isPickingImage}>
              Choose from Gallery
            </Button>
          </View>

          <View style={styles.features}>
            <Paragraph style={styles.featureText}>✓ 30+ Vietnamese dishes</Paragraph>
            <Paragraph style={styles.featureText}>✓ 97%+ accuracy</Paragraph>
            <Paragraph style={styles.featureText}>✓ Nutritional information</Paragraph>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: Platform.select({ios: '600', android: 'bold'}),
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  instructions: {
    marginBottom: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    borderRadius: Platform.select({ios: 12, android: 8}),
  },
  buttonContent: {
    paddingVertical: Platform.select({ios: 12, android: 8}),
  },
  features: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default HomeScreen;
