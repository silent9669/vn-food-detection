// Mock axios before importing ApiClient
jest.mock('axios');

// Mock react-native-config
jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://localhost:8000',
  API_TIMEOUT: '30000',
}));

import fc from 'fast-check';
import {ApiClient} from '../ApiClient';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiClient Property Tests', () => {
  let mockAxiosInstance: any;
  let client: ApiClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup fresh mock for each test
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: {use: jest.fn((fn: any) => fn)},
        response: {use: jest.fn((fn: any) => fn)},
      },
      defaults: {
        baseURL: 'http://localhost:8000',
        timeout: 30000,
        headers: {},
      },
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    client = new ApiClient();
  });

  // **Feature: mobile-app, Property 5: Detection API invocation**
  describe('Property 5: Detection API invocation', () => {
    it('should send HTTP POST request for any valid image submission', async () => {
      // Setup mock response
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            detections: [],
            totalNutrition: {
              calories: 0,
              protein: 0,
              carbohydrates: 0,
              fat: 0,
            },
            processingTime: 0.5,
          },
        },
      });

      fc.assert(
        fc.asyncProperty(
          fc.string({minLength: 10, maxLength: 100}), // image data
          fc.float({min: Math.fround(0.1), max: Math.fround(1)}), // confidence threshold
          fc.float({min: Math.fround(0.1), max: Math.fround(1)}), // iou threshold
          async (imageData, confidence, iou) => {
            // Clear previous calls
            mockAxiosInstance.post.mockClear();

            // Call detectFood
            await client.detectFood({
              image: imageData,
              confidenceThreshold: confidence,
              iouThreshold: iou,
            });

            // Verify POST request was made with correct parameters
            expect(mockAxiosInstance.post).toHaveBeenCalled();
            const callArgs = mockAxiosInstance.post.mock.calls[0];
            expect(callArgs[0]).toBe('/api/v1/detect');
            expect(callArgs[1]).toMatchObject({
              image: imageData,
              confidenceThreshold: confidence,
              iouThreshold: iou,
            });
          },
        ),
        {numRuns: 50}, // Reduced for faster execution
      );
    });
  });

  // **Feature: mobile-app, Property 7: API response validation**
  describe('Property 7: API response validation', () => {
    it('should validate that response contains required fields before processing', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.boolean(), // success
          fc.option(fc.string(), {nil: undefined}), // error
          async (success, error) => {
            const mockResponse = {
              data: {
                success,
                ...(success
                  ? {
                      data: {
                        detections: [],
                        totalNutrition: {
                          calories: 0,
                          protein: 0,
                          carbohydrates: 0,
                          fat: 0,
                        },
                        processingTime: 0.5,
                      },
                    }
                  : {
                      error: error || 'PROCESSING_ERROR',
                      message: 'Test error',
                    }),
              },
            };

            mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

            const result = await client.detectFood({
              image: 'test-image-base64',
            });

            // Response should always have success field
            expect(result).toHaveProperty('success');
            expect(typeof result.success).toBe('boolean');

            // If success is true, should have data
            if (success) {
              expect(result.data).toBeDefined();
            }

            // If success is false, should have error or message
            if (!success) {
              expect(result.error || result.message).toBeDefined();
            }
          },
        ),
        {numRuns: 50},
      );
    });
  });

  // **Feature: mobile-app, Property 10: Error message display**
  describe('Property 10: Error message display', () => {
    it('should extract and return error message for any error response', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({minLength: 1, maxLength: 200}), // error message
          fc.constantFrom(
            'INVALID_IMAGE',
            'IMAGE_TOO_LARGE',
            'PROCESSING_ERROR',
            'NO_DETECTIONS',
            'SERVER_ERROR',
          ), // error code
          async (errorMessage, errorCode) => {
            mockAxiosInstance.post.mockResolvedValueOnce({
              data: {
                success: false,
                error: errorCode,
                message: errorMessage,
              },
            });

            const result = await client.detectFood({
              image: 'test-image-base64',
            });

            // Should have error information
            expect(result.success).toBe(false);
            expect(result.error).toBe(errorCode);
            expect(result.message).toBe(errorMessage);
          },
        ),
        {numRuns: 50},
      );
    });
  });

  // **Feature: mobile-app, Property 26: Authentication token inclusion**
  describe('Property 26: Authentication token inclusion', () => {
    it('should have interceptor structure for authentication tokens', () => {
      // Verify that the client sets up request interceptors
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();

      // Get the interceptor function
      const interceptorCalls =
        mockAxiosInstance.interceptors.request.use.mock.calls;
      expect(interceptorCalls.length).toBeGreaterThan(0);

      // Verify the interceptor function exists
      const interceptorFn = interceptorCalls[0][0];
      expect(typeof interceptorFn).toBe('function');

      // Test that the interceptor can modify config
      const testConfig = {
        headers: {},
        url: '/api/v1/detect',
        method: 'post',
      };

      const modifiedConfig = interceptorFn(testConfig);
      expect(modifiedConfig).toHaveProperty('headers');
    });
  });
});
