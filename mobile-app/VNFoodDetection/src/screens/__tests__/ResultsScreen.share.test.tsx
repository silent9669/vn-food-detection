/**
 * Tests for ResultsScreen share functionality
 * Task 26.1: Write unit test for share functionality
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import ResultsScreen from '../ResultsScreen';
import Share from 'react-native-share';
import {Alert} from 'react-native';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: {
      imageUri: 'file:///test-image.jpg',
    },
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('react-native-view-shot', () => 'ViewShot');

jest.mock('../../services/ApiClient', () => {
  return jest.fn().mockImplementation(() => ({
    detectFood: jest.fn().mockResolvedValue({
      success: true,
      data: {
        detections: [
          {
            id: 'det_001',
            dish_name: 'Phở tái',
            confidence: 0.95,
            bounding_box: {x: 0.1, y: 0.1, width: 0.4, height: 0.4},
            nutrition: {
              calories: 450,
              protein: 25,
              carbohydrates: 60,
              fat: 12,
            },
            count: 1,
          },
        ],
        total_nutrition: {
          calories: 450,
          protein: 25,
          carbohydrates: 60,
          fat: 12,
        },
        processing_time: 1.5,
      },
    }),
  }));
});

jest.mock('../../services/ImageProcessor', () => ({
  convertToBase64: jest.fn().mockResolvedValue('base64string'),
  getImageDimensions: jest.fn().mockResolvedValue({width: 300, height: 400}),
}));

jest.spyOn(Alert, 'alert');

describe('ResultsScreen - Share Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display share button when results are available', async () => {
    const {getByText} = render(<ResultsScreen />);

    // Wait for detection to complete
    await waitFor(() => {
      expect(getByText('Share Results')).toBeTruthy();
    });
  });

  it('should not display share button when no results', async () => {
    // Mock API to return no detections
    const ApiClient = require('../../services/ApiClient');
    ApiClient.mockImplementation(() => ({
      detectFood: jest.fn().mockResolvedValue({
        success: true,
        data: {
          detections: [],
          total_nutrition: {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
          },
          processing_time: 1.0,
        },
      }),
    }));

    const {queryByText} = render(<ResultsScreen />);

    // Wait for detection to complete
    await waitFor(() => {
      expect(queryByText('No Food Detected')).toBeTruthy();
    });

    // Share button should not be present
    expect(queryByText('Share Results')).toBeNull();
  });

  it('should call Share.open when share button is pressed', async () => {
    const mockCapture = jest.fn().mockResolvedValue('/path/to/screenshot.png');
    
    // Mock ViewShot ref
    const useRefSpy = jest.spyOn(React, 'useRef');
    useRefSpy.mockReturnValue({
      current: {
        capture: mockCapture,
      },
    });

    const {getByText} = render(<ResultsScreen />);

    // Wait for detection to complete
    await waitFor(() => {
      expect(getByText('Share Results')).toBeTruthy();
    });

    // Press share button
    fireEvent.press(getByText('Share Results'));

    // Wait for share to be called
    await waitFor(() => {
      expect(mockCapture).toHaveBeenCalled();
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Share Detection Results',
          message: expect.stringContaining('Vietnamese Food Detection Results'),
          url: expect.stringContaining('file://'),
          type: 'image/png',
        }),
      );
    });

    useRefSpy.mockRestore();
  });

  it('should handle share cancellation gracefully', async () => {
    const mockCapture = jest.fn().mockResolvedValue('/path/to/screenshot.png');
    (Share.open as jest.Mock).mockRejectedValue({
      message: 'User did not share',
    });

    const useRefSpy = jest.spyOn(React, 'useRef');
    useRefSpy.mockReturnValue({
      current: {
        capture: mockCapture,
      },
    });

    const {getByText} = render(<ResultsScreen />);

    await waitFor(() => {
      expect(getByText('Share Results')).toBeTruthy();
    });

    fireEvent.press(getByText('Share Results'));

    await waitFor(() => {
      expect(mockCapture).toHaveBeenCalled();
    });

    // Should not show alert for user cancellation
    expect(Alert.alert).not.toHaveBeenCalled();

    useRefSpy.mockRestore();
  });

  it('should show alert when share fails', async () => {
    const mockCapture = jest.fn().mockResolvedValue('/path/to/screenshot.png');
    (Share.open as jest.Mock).mockRejectedValue(new Error('Share failed'));

    const useRefSpy = jest.spyOn(React, 'useRef');
    useRefSpy.mockReturnValue({
      current: {
        capture: mockCapture,
      },
    });

    const {getByText} = render(<ResultsScreen />);

    await waitFor(() => {
      expect(getByText('Share Results')).toBeTruthy();
    });

    fireEvent.press(getByText('Share Results'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Share Failed',
        'Failed to share results. Please try again.',
      );
    });

    useRefSpy.mockRestore();
  });

  it('should disable share button while sharing', async () => {
    const mockCapture = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('/path/to/screenshot.png'), 100)),
    );

    const useRefSpy = jest.spyOn(React, 'useRef');
    useRefSpy.mockReturnValue({
      current: {
        capture: mockCapture,
      },
    });

    const {getByText} = render(<ResultsScreen />);

    await waitFor(() => {
      expect(getByText('Share Results')).toBeTruthy();
    });

    const shareButton = getByText('Share Results');
    fireEvent.press(shareButton);

    // Button should show loading state
    await waitFor(() => {
      expect(getByText('Sharing...')).toBeTruthy();
    });

    useRefSpy.mockRestore();
  });

  it('should prevent duplicate share submissions', async () => {
    const mockCapture = jest.fn().mockResolvedValue('/path/to/screenshot.png');

    const useRefSpy = jest.spyOn(React, 'useRef');
    useRefSpy.mockReturnValue({
      current: {
        capture: mockCapture,
      },
    });

    const {getByText} = render(<ResultsScreen />);

    await waitFor(() => {
      expect(getByText('Share Results')).toBeTruthy();
    });

    const shareButton = getByText('Share Results');
    
    // Press multiple times quickly
    fireEvent.press(shareButton);
    fireEvent.press(shareButton);
    fireEvent.press(shareButton);

    await waitFor(() => {
      // Should only capture once
      expect(mockCapture).toHaveBeenCalledTimes(1);
    });

    useRefSpy.mockRestore();
  });
});
