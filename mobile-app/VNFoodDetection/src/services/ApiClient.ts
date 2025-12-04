import axios, {AxiosInstance, AxiosError} from 'axios';
import Config from 'react-native-config';
import {DetectionRequest, DetectionResponse} from '../types';

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    // Default configuration from environment variables
    this.config = {
      baseURL: Config.API_BASE_URL || 'http://localhost:8000',
      timeout: parseInt(Config.API_TIMEOUT || '30000', 10),
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };

    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      requestConfig => {
        // Add authentication token if available
        const token = this.getAuthToken();
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
      },
      error => Promise.reject(error),
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => this.handleError(error),
    );
  }

  /**
   * Get authentication token (placeholder for future implementation)
   */
  private getAuthToken(): string | null {
    // TODO: Implement token retrieval from secure storage
    return null;
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const errorMessage =
        (error.response.data as any)?.message || 'Server error occurred';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('Network error: No response from server'));
    } else {
      // Error in request setup
      return Promise.reject(new Error(error.message || 'Request failed'));
    }
  }

  /**
   * Retry a function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise<void>(resolve => setTimeout(() => resolve(), delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Detect food items in an image
   */
  async detectFood(request: DetectionRequest): Promise<DetectionResponse> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.axiosInstance.post<DetectionResponse>(
          '/api/v1/detect',
          request,
        );
      });

      return response.data;
    } catch (error) {
      console.error('Detection API error:', error);
      return {
        success: false,
        error: 'PROCESSING_ERROR',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Convert image URI to base64 string
   */
  async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      // For React Native, we'll use fetch to read the file
      const response = await fetch(imageUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove data:image/...;base64, prefix
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Upload image and get detection results
   */
  async uploadImage(imageUri: string): Promise<DetectionResponse> {
    try {
      const base64Image = await this.convertImageToBase64(imageUri);

      const request: DetectionRequest = {
        image: base64Image,
        confidenceThreshold: 0.5,
        iouThreshold: 0.45,
      };

      return await this.detectFood(request);
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: 'UPLOAD_ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/api/v1/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Update API configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = {...this.config, ...config};
    this.axiosInstance.defaults.baseURL = this.config.baseURL;
    this.axiosInstance.defaults.timeout = this.config.timeout;
    this.axiosInstance.defaults.headers = {
      ...this.axiosInstance.defaults.headers,
      ...this.config.headers,
    } as any;
  }
}

// Export the class
export {ApiClient};

// Export singleton instance (created lazily to avoid issues in tests)
export default ApiClient;
