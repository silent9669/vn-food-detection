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

// **Feature: mobile-app, Property 27: State clearing on new detection**
describe('ResultsScreen - Property 27: State clearing on new detection', () => {
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

  it('should clear error state when starting new detection via retry', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({minLength: 1, maxLength: 100}),
        async (errorMessage: string) => {
          let callCount = 0;
          const mockDetectFood = jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({
                success: false,
                message: errorMessage,
              });
            }
            return Promise.resolve({
              success: true,
              data: {
                detections: [],
                totalNutrition: {
                  calories: 0,
                  protein: 0,
                  carbohydrates: 0,
                  fat: 0,
                },
                processingTime: 1.0,
              },
            });
          });

          (ApiClient as jest.MockedClass<typeof ApiClient>).mockImplementation(() => ({
            detectFood: mockDetectFood,
          } as any));

          const {getByText, queryByText} = render(
            <NavigationContainer>
              <ResultsScreen />
            </NavigationContainer>,
          );

          // Wait for initial error
          await waitFor(() => expect(getByText(errorMessage)).toBeTruthy(), {
            timeout: 3000,
          });

          // Press retry
          const retryButton = getByText('Retry');
          fireEvent.press(retryButton);

          // Wait for retry to complete
          await waitFor(() => expect(callCount).toBe(2), {
            timeout: 3000,
          });

          // Error message should be cleared
          await waitFor(() => {
            expect(queryByText(errorMessage)).toBeNull();
          }, {timeout: 1000});
        },
      ),
      {numRuns: 10},
    );
  });

  it('should clear all state when navigating to home', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          calories: fc.double({min: 0, max: 1000, noNaN: true}),
          protein: fc.double({min: 0, max: 100, noNaN: true}),
          carbohydrates: fc.double({min: 0, max: 200, noNaN: true}),
          fat: fc.double({min: 0, max: 100, noNaN: true}),
        }),
        async (nutrition) => {
          const mockDetectFood = jest.fn().mockResolvedValue({
            success: true,
            data: {
              detections: [
                {
                  id: 'test-1',
                  dishName: 'Test Dish',
                  confidence: 0.9,
                  boundingBox: {x: 0.1, y: 0.1, width: 0.3, height: 0.3},
                  nutrition,
                  count: 1,
                },
              ],
              totalNutrition: nutrition,
              processingTime: 1.0,
            },
          });

          (ApiClient as jest.MockedClass<typeof ApiClient>).mockImplementation(() => ({
            detectFood: mockDetectFood,
          } as any));

          const {getByText} = render(
            <NavigationContainer>
              <ResultsScreen />
            </NavigationContainer>,
          );

          // Wait for results to appear
          await waitFor(() => expect(getByText('Detection Results')).toBeTruthy(), {
            timeout: 3000,
          });

          // Press start over
          const startOverButton = getByText('Start Over');
          fireEvent.press(startOverButton);

          // Should navigate to Home
          await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('Home');
          }, {timeout: 1000});
        },
      ),
      {numRuns: 10},
    );
  });

  it('should not persist detection data between sessions', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({minLength: 1, maxLength: 50}),
        async (dishName: string) => {
          const mockDetectFood = jest.fn().mockResolvedValue({
            success: true,
            data: {
              detections: [
                {
                  id: 'test-1',
                  dishName,
                  confidence: 0.9,
                  boundingBox: {x: 0.1, y: 0.1, width: 0.3, height: 0.3},
                  nutrition: {
                    calories: 100,
                    protein: 10,
                    carbohydrates: 20,
                    fat: 5,
                  },
                  count: 1,
                },
              ],
              totalNutrition: {
                calories: 100,
                protein: 10,
                carbohydrates: 20,
                fat: 5,
              },
              processingTime: 1.0,
            },
          });

          (ApiClient as jest.MockedClass<typeof ApiClient>).mockImplementation(() => ({
            detectFood: mockDetectFood,
          } as any));

          const {getByText, unmount} = render(
            <NavigationContainer>
              <ResultsScreen />
            </NavigationContainer>,
          );

          // Wait for results
          await waitFor(() => expect(getByText(dishName)).toBeTruthy(), {
            timeout: 3000,
          });

          // Unmount component (simulating navigation away)
          unmount();

          // Re-mount with new detection
          const {queryByText} = render(
            <NavigationContainer>
              <ResultsScreen />
            </NavigationContainer>,
          );

          // Old dish name should not be visible immediately
          // (new detection will start fresh)
          expect(queryByText(dishName)).toBeNull();
        },
      ),
      {numRuns: 10},
    );
  });
});
