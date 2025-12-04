import {DetectionResult} from './detection';

// App state types

export interface AppState {
  isOnline: boolean;
  apiEndpoint: string;
  currentDetection: DetectionResult | null;
}

// Permission types

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export interface PermissionState {
  camera: PermissionStatus;
  gallery: PermissionStatus;
}
