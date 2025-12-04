// Simplified tests for ApiClient to verify core functionality
// Mock axios before importing ApiClient
jest.mock('axios');
jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://localhost:8000',
  API_TIMEOUT: '30000',
}));

import {ApiClient} from '../ApiClient';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiClient Tests', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

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
  });

  // **Feature: mobile-app, Property 5: Detection API invocation**
  it('should send POST request to /api/v1/detect endpoint', async () => {
    mockAxiosInstance.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          detections: [],
          totalNutrition: {calories: 0, protein: 0, carbohydrates: 0, fat: 0},
          processingTime: 0.5,
        },
      },
    });

    const client = new ApiClient();
    await client.detectFood({
      image: 'test-image',
      confidenceThreshold: 0.5,
      iouThreshold: 0.45,
    });

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/detect', {
      image: 'test-image',
      confidenceThreshold: 0.5,
      iouThreshold: 0.45,
    });
  });

  // **Feature: mobile-app, Property 7: API response validation**
  it('should validate response structure', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          detections: [],
          totalNutrition: {calories: 100, protein: 10, carbohydrates: 20, fat: 5},
          processingTime: 1.0,
        },
      },
    };

    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    const client = new ApiClient();
    const result = await client.detectFood({image: 'test'});

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  // **Feature: mobile-app, Property 10: Error message display**
  it('should return error information for failed requests', async () => {
    mockAxiosInstance.post.mockResolvedValue({
      data: {
        success: false,
        error: 'PROCESSING_ERROR',
        message: 'Test error message',
      },
    });

    const client = new ApiClient();
    const result = await client.detectFood({image: 'test'});

    expect(result.success).toBe(false);
    expect(result.error).toBe('PROCESSING_ERROR');
    expect(result.message).toBe('Test error message');
  });

  // **Feature: mobile-app, Property 26: Authentication token inclusion**
  it('should set up request interceptor for authentication', () => {
    new ApiClient();

    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    const interceptorFn =
      mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    expect(typeof interceptorFn).toBe('function');
  });

  it('should check API health', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: {status: 'healthy', models_loaded: true},
    });

    const client = new ApiClient();
    const isHealthy = await client.checkHealth();

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/health');
    expect(isHealthy).toBe(true);
  });
});
