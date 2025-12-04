import {DetectionResult} from './detection';

// API types

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface DetectionRequest {
  image: string; // base64 encoded
  confidenceThreshold?: number;
  iouThreshold?: number;
}

export interface DetectionResponse {
  success: boolean;
  data?: DetectionResult;
  error?: string;
  message?: string;
}
