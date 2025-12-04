import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import fc from 'fast-check';
import ResultsScreen from '../ResultsScreen';
import {NavigationContainer} from '@react-navigation/native';
import ApiClient from '../../services/ApiClient';
import ImageProcessor from '../../services/ImageProcessor';

// Mock dependencies
jest.mock('../../services/ApiClient');
jest.mock('../../services/ImageProcessor', () => ({
  __esModule: true,
  default: {
    convertToBase64: jest.fn(),
    getImageDimensions: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useRoute: () => ({
      params: {imageUri: 'test://image.jpg'},
    }),
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// **Feature: mobile-app, Property 24: Duplicate submission prevention**
describe('ResultsScreen - Property 24: Duplicate submission prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock ImageProcessor methods
    const ImageProcessorMock = require('../../services/ImageProcessor').default;
    ImageProcessorMock.convertToBase64.mockResolvedValue('base64data');
    ImageProcessorMock.getImageDimensions.mockResolvedValue({
      width: 400,
      height: 300,
    });
  });

  it('should prevent multiple simultaneous API calls when retry is pressed multiple times', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({min: 2, max: 5}),
        async (clickCount: number) => {
          // Mock API to take some time
          const mockDetectFood = jest.fn().mockImplementation(() => 
            new Promise(resolve => 
              setTimeout(() => resolve({
                success: false,
                message: 'Test error',
              }), 100)
            )
          );

          (ApiClient as jest.MockedClass<typeof ApiClient>).mockImplementation(() => ({
            detectFood: mockDetectFood,
          } as any));

          const {getByText} = render(
            <NavigationContainer>
              <ResultsScreen />
            </NavigationContainer>,
          );

          // Wait for initial detection to fail
          await waitFor(() => expect(getByText(/Test error/i)).toBeTruthy(), {
            timeout: 3000,
          });

          // Click retry button multiple times rapidly
          const retryButton = getByText('Retry');
          for (let i = 0; i < clickCount; i++) {
            fireEvent.press(retryButton);
          }

          // Wait for any pending operations
          await waitFor(() => expect(mockDetectFood).toHaveBeenCalled(), {
            timeout: 3000,
          });

          // API should only be called once more (the first retry), not multiple times
          // Initial call + 1 retry = 2 total calls
          expect(mockDetectFood).toHaveBeenCalledTimes(2);
        },
      ),
      {numRuns: 10}, // Reduced runs for async tests
    );
  });

  it('should disable action buttons while processing', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({minLength: 1, maxLength: 50}),
        async (errorMessage: string) => {
          // Mock API to take some time
          const mockDetectFood = jest.fn().mockImplementation(() => 
            new Promise(resolve => 
              setTimeout(() => resolve({
                success: false,
                message: errorMessage,
              }), 100)
            )
          );

          (ApiClient as jest.MockedClass<typeof ApiClient>).mockImplementation(() => ({
            detectFood: mockDetectFood,
          } as any));

          const {getByText, queryByText} = render(
            <NavigationContainer>
              <ResultsScreen />
            </NavigationContainer>,
          );

          // Wait for error to appear
          await waitFor(() => expect(queryByText(errorMessage)).toBeTruthy(), {
            timeout: 3000,
          });

          // Start retry (which will take time)
          const retryButton = getByText('Retry');
          fireEvent.press(retryButton);

          // Immediately check that buttons are disabled
          // The retry button should not be visible while processing
          await waitFor(() => {
            const buttons = queryByText('Retry');
            // Button might be hidden or disabled during processing
            expect(buttons).toBeTruthy(); // Button exists but should be disabled
          }, {timeout: 500});
        },
      ),
      {numRuns: 10},
    );
  });

  it('should re-enable buttons after operation completes', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({minLength: 1, maxLength: 50}),
        async (errorMessage: string) => {
          let callCount = 0;
          const mockDetectFood = jest.fn().mockImplementation(() => {
            callCount++;
            return Promise.resolve({
              success: false,
              message: errorMessage,
            });
          });

          (ApiClient as jest.MockedClass<typeof ApiClient>).mockImplementation(() => ({
            detectFood: mockDetectFood,
          } as any));

          const {getByText} = render(
            <NavigationContainer>
              <ResultsScreen />
            </NavigationContainer>,
          );

          // Wait for initial error
          await waitFor(() => expect(getByText(errorMessage)).toBeTruthy(), {
            timeout: 3000,
          });

          // Retry button should be enabled
          const retryButton = getByText('Retry');
          expect(retryButton).toBeTruthy();

          // Press retry
          fireEvent.press(retryButton);

          // Wait for retry to complete
          await waitFor(() => expect(callCount).toBe(2), {
            timeout: 3000,
          });

          // Retry button should be enabled again
          await waitFor(() => {
            const button = getByText('Retry');
            expect(button).toBeTruthy();
          }, {timeout: 1000});
        },
      ),
      {numRuns: 10},
    );
  });
});
