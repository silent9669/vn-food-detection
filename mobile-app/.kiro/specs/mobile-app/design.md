# Design Document

## Overview

The Vietnamese Food Detection Mobile App is a cross-platform React Native application that provides a simple demonstration interface for the hybrid YOLOv10 + EfficientNet food detection system. The app enables users to capture or select food images, send them to a VPS-hosted inference service, and view detection results with nutritional information overlays.

The application follows a client-server architecture where the mobile app acts as a lightweight client that handles image capture, API communication, and result visualization, while the heavy ML inference workload runs on a remote VPS server.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         React Native Mobile App         │
│  ┌───────────────────────────────────┐  │
│  │     UI Layer (Components)         │  │
│  │  - Camera Screen                  │  │
│  │  - Gallery Picker                 │  │
│  │  - Results Display                │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │   Business Logic Layer            │  │
│  │  - Image Processing               │  │
│  │  - API Client                     │  │
│  │  - State Management               │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │   Platform Services               │  │
│  │  - Camera API (iOS/Android)       │  │
│  │  - Image Picker (iOS/Android)     │  │
│  │  - Permissions (iOS/Android)      │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTPS/REST API
               │
┌──────────────▼──────────────────────────┐
│         VPS Inference Server            │
│  ┌───────────────────────────────────┐  │
│  │   REST API Endpoint               │  │
│  │   (Flask/FastAPI)                 │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │   Hybrid Detection Pipeline       │  │
│  │  - YOLOv10 Detection              │  │
│  │  - EfficientNet Classification    │  │
│  │  - Nutrition Calculation          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Technology Stack

**Mobile App:**
- **Framework**: React Native 0.73+
- **Language**: TypeScript
- **State Management**: React Context API + Hooks
- **HTTP Client**: Axios
- **Camera**: react-native-vision-camera
- **Image Picker**: react-native-image-picker
- **Permissions**: react-native-permissions
- **UI Components**: React Native Paper (Material Design)
- **Navigation**: React Navigation 6.x
- **Build Tools**: 
  - Android: Gradle
  - iOS: Xcode + CocoaPods

**Backend (VPS):**
- **Framework**: FastAPI (Python)
- **ML Libraries**: PyTorch, Ultralytics
- **Image Processing**: OpenCV, Pillow
- **Server**: Uvicorn
- **Containerization**: Docker (optional)

## Components and Interfaces

### Mobile App Components

#### 1. App Entry Point (`App.tsx`)
- Initializes navigation structure
- Sets up global state providers
- Handles app-level error boundaries
- Configures theme and styling

#### 2. Navigation Structure
```typescript
NavigationContainer
├── MainStack
    ├── HomeScreen (default)
    ├── CameraScreen
    ├── ResultsScreen
```

#### 3. HomeScreen Component
**Purpose**: Landing screen with action buttons

**Interface**:
```typescript
interface HomeScreenProps {
  navigation: NavigationProp<any>;
}

// Actions
- navigateToCamera(): void
- navigateToGallery(): void
```

**Responsibilities**:
- Display app branding and instructions
- Provide camera capture button
- Provide gallery selection button
- Check and request permissions

#### 4. CameraScreen Component
**Purpose**: Live camera preview and capture

**Interface**:
```typescript
interface CameraScreenProps {
  navigation: NavigationProp<any>;
}

interface CameraState {
  hasPermission: boolean;
  isCapturing: boolean;
  capturedImage: string | null;
}

// Methods
- requestCameraPermission(): Promise<boolean>
- capturePhoto(): Promise<string>
- retakePhoto(): void
- proceedWithDetection(imageUri: string): void
```

**Responsibilities**:
- Request camera permissions
- Display live camera preview
- Capture photo and save temporarily
- Navigate to results screen with image

#### 5. ImagePickerService
**Purpose**: Handle gallery image selection

**Interface**:
```typescript
interface ImagePickerOptions {
  mediaType: 'photo';
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  type: string;
}

// Methods
- pickImageFromGallery(options: ImagePickerOptions): Promise<ImagePickerResult>
- requestGalleryPermission(): Promise<boolean>
```

#### 6. ResultsScreen Component
**Purpose**: Display detection results with overlays

**Interface**:
```typescript
interface ResultsScreenProps {
  route: {
    params: {
      imageUri: string;
    };
  };
  navigation: NavigationProp<any>;
}

interface ResultsState {
  isLoading: boolean;
  detectionResult: DetectionResult | null;
  error: string | null;
}

interface DetectionResult {
  detections: FoodDetection[];
  totalNutrition: NutritionInfo;
  processingTime: number;
}

interface FoodDetection {
  id: string;
  dishName: string;
  confidence: number;
  boundingBox: BoundingBox;
  nutrition: NutritionInfo;
  count: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

// Methods
- performDetection(imageUri: string): Promise<void>
- renderBoundingBoxes(): JSX.Element
- renderNutritionSummary(): JSX.Element
- handleRetry(): void
- handleNewDetection(): void
```

**Responsibilities**:
- Display selected/captured image
- Show loading indicator during inference
- Call inference API
- Render bounding boxes over image
- Display food names and confidence scores
- Show nutritional information
- Handle errors and retries

#### 7. DetectionOverlay Component
**Purpose**: Render bounding boxes and labels on image

**Interface**:
```typescript
interface DetectionOverlayProps {
  imageWidth: number;
  imageHeight: number;
  detections: FoodDetection[];
  onDetectionTap?: (detection: FoodDetection) => void;
}

// Methods
- calculateBoxPosition(box: BoundingBox): ViewStyle
- getConfidenceColor(confidence: number): string
- renderBox(detection: FoodDetection): JSX.Element
```

#### 8. NutritionCard Component
**Purpose**: Display nutritional information

**Interface**:
```typescript
interface NutritionCardProps {
  nutrition: NutritionInfo;
  detections: FoodDetection[];
  showDetails: boolean;
}

// Methods
- renderTotalNutrition(): JSX.Element
- renderDetailedBreakdown(): JSX.Element
- toggleDetails(): void
```

#### 9. ApiClient Service
**Purpose**: Handle all API communication

**Interface**:
```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

interface DetectionRequest {
  image: string; // base64 encoded
  confidenceThreshold?: number;
  iouThreshold?: number;
}

interface DetectionResponse {
  success: boolean;
  data?: DetectionResult;
  error?: string;
  message?: string;
}

class ApiClient {
  constructor(config: ApiClientConfig);
  
  // Methods
  detectFood(request: DetectionRequest): Promise<DetectionResponse>
  uploadImage(imageUri: string): Promise<string>
  checkHealth(): Promise<boolean>
}
```

**Responsibilities**:
- Configure API endpoint from environment
- Convert image to base64 or multipart form data
- Send POST request to inference endpoint
- Handle network errors and timeouts
- Parse and validate API responses
- Implement retry logic

#### 10. ImageProcessor Service
**Purpose**: Prepare images for upload

**Interface**:
```typescript
interface ImageProcessorOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'JPEG' | 'PNG';
}

class ImageProcessor {
  // Methods
  resizeImage(uri: string, options: ImageProcessorOptions): Promise<string>
  convertToBase64(uri: string): Promise<string>
  getImageDimensions(uri: string): Promise<{width: number, height: number}>
  compressImage(uri: string, quality: number): Promise<string>
}
```

### Backend API Interface

#### Inference Endpoint

**Endpoint**: `POST /api/v1/detect`

**Request**:
```json
{
  "image": "base64_encoded_image_string",
  "confidence_threshold": 0.5,
  "iou_threshold": 0.45
}
```

Or multipart/form-data:
```
image: <binary file>
confidence_threshold: 0.5
iou_threshold: 0.45
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "detections": [
      {
        "id": "det_001",
        "dish_name": "Phở tái",
        "confidence": 0.95,
        "bounding_box": {
          "x": 100,
          "y": 150,
          "width": 300,
          "height": 250
        },
        "nutrition": {
          "calories": 450,
          "protein": 25,
          "carbohydrates": 60,
          "fat": 12
        },
        "count": 1
      }
    ],
    "total_nutrition": {
      "calories": 450,
      "protein": 25,
      "carbohydrates": 60,
      "fat": 12
    },
    "processing_time": 1.23
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "INVALID_IMAGE",
  "message": "The uploaded image format is not supported"
}
```

**Error Codes**:
- `INVALID_IMAGE`: Image format not supported
- `IMAGE_TOO_LARGE`: Image exceeds size limit
- `PROCESSING_ERROR`: Error during model inference
- `NO_DETECTIONS`: No food items detected
- `SERVER_ERROR`: Internal server error

#### Health Check Endpoint

**Endpoint**: `GET /api/v1/health`

**Response**:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "version": "1.0.0"
}
```

## Data Models

### TypeScript Interfaces

```typescript
// Core detection types
export interface DetectionResult {
  detections: FoodDetection[];
  totalNutrition: NutritionInfo;
  processingTime: number;
}

export interface FoodDetection {
  id: string;
  dishName: string;
  confidence: number;
  boundingBox: BoundingBox;
  nutrition: NutritionInfo;
  count: number;
}

export interface BoundingBox {
  x: number;        // pixels from left
  y: number;        // pixels from top
  width: number;    // box width in pixels
  height: number;   // box height in pixels
}

export interface NutritionInfo {
  calories: number;      // kcal
  protein: number;       // grams
  carbohydrates: number; // grams
  fat: number;          // grams
}

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

// App state types
export interface AppState {
  isOnline: boolean;
  apiEndpoint: string;
  currentDetection: DetectionResult | null;
}

// Permission types
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface PermissionState {
  camera: PermissionStatus;
  gallery: PermissionStatus;
}
```

### Environment Configuration

```typescript
// .env.development
API_BASE_URL=http://localhost:8000
API_TIMEOUT=30000
MAX_IMAGE_SIZE=5242880
IMAGE_QUALITY=0.8

// .env.production
API_BASE_URL=https://your-vps-domain.com
API_TIMEOUT=30000
MAX_IMAGE_SIZE=5242880
IMAGE_QUALITY=0.8
```

## Cor
rectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Image capture persistence
*For any* camera capture action, the resulting image should be stored in temporary device memory and accessible via a valid URI
**Validates: Requirements 1.2**

### Property 2: Captured image display
*For any* captured or selected image URI, the app should render the image along with retry and proceed action buttons
**Validates: Requirements 1.3, 2.3**

### Property 3: Gallery image loading
*For any* valid image selected from the gallery, the app should successfully load and display the image
**Validates: Requirements 2.2**

### Property 4: Unsupported format rejection
*For any* image file with an unsupported format (not JPEG/PNG), the app should reject it and display an error message listing supported formats
**Validates: Requirements 2.5**

### Property 5: Detection API invocation
*For any* valid image submission, the app should send an HTTP POST request to the configured inference endpoint with the image data
**Validates: Requirements 3.1**

### Property 6: Loading indicator visibility
*For any* active API request state, the app should display a loading indicator that remains visible until the request completes or fails
**Validates: Requirements 3.2, 8.2**

### Property 7: API response validation
*For any* response received from the inference service, the app should validate that it contains the required fields (success, data/error) before processing
**Validates: Requirements 3.3**

### Property 8: Bounding box rendering
*For any* detection result containing N food items, the app should render exactly N bounding boxes overlaid on the image
**Validates: Requirements 3.4**

### Property 9: Unique detection identifiers
*For any* detection result with multiple items, each bounding box should have a unique identifier and be visually distinct
**Validates: Requirements 3.5**

### Property 10: Error message display
*For any* error response from the API, the app should extract and display the error message to the user
**Validates: Requirements 3.7, 7.1**

### Property 11: Dish name rendering
*For any* detection result with N identified food items, the app should display exactly N Vietnamese dish names
**Validates: Requirements 4.1**

### Property 12: Confidence score formatting
*For any* food detection with a confidence value C (0 ≤ C ≤ 1), the app should display it as a percentage (C × 100) next to the dish name
**Validates: Requirements 4.2**

### Property 13: Duplicate dish counting
*For any* detection result containing multiple instances of the same dish, the app should aggregate them and display the count
**Validates: Requirements 4.3**

### Property 14: Low confidence warning
*For any* detection with confidence score below 0.5, the app should apply warning color styling to the visual indicator
**Validates: Requirements 4.4**

### Property 15: Detection highlighting
*For any* detected item tapped by the user, the corresponding bounding box should be highlighted with distinct visual styling
**Validates: Requirements 4.5**

### Property 16: Nutrition data display
*For any* detection result containing nutritional information, the app should display all four values: calories, protein, carbohydrates, and fat
**Validates: Requirements 5.1**

### Property 17: Serving count multiplication
*For any* detected dish with count N and per-serving nutrition values, the displayed nutrition should equal N × per_serving_nutrition for each nutrient
**Validates: Requirements 5.2**

### Property 18: Total nutrition summation
*For any* detection result with multiple food items, the total nutrition should equal the sum of individual item nutritions: total_calories = Σ(item_calories), total_protein = Σ(item_protein), etc.
**Validates: Requirements 5.3**

### Property 19: Nutrition detail toggle
*For any* nutrition display component, tapping it should toggle the visibility of the detailed per-dish breakdown
**Validates: Requirements 5.4**

### Property 20: Network error handling
*For any* failed network request, the app should display a user-friendly error message and provide a retry option
**Validates: Requirements 7.1, 7.3**

### Property 21: Error logging
*For any* unexpected error that occurs, the app should log the error details (message, stack trace) before displaying a generic error message
**Validates: Requirements 7.5**

### Property 22: Upload progress indication
*For any* image upload in progress, the app should display a progress indicator that reflects the upload state
**Validates: Requirements 8.1**

### Property 23: Result rendering performance
*For any* detection result received, the app should render the results within 500 milliseconds
**Validates: Requirements 8.3**

### Property 24: Duplicate submission prevention
*For any* operation in progress (upload, detection), all action buttons should be disabled until the operation completes
**Validates: Requirements 8.4**

### Property 25: Operation timeout handling
*For any* operation that exceeds 30 seconds, the app should display a timeout message and provide a cancel option
**Validates: Requirements 8.5**

### Property 26: Authentication token inclusion
*For any* API request when authentication is enabled, the request headers should include a valid authentication token
**Validates: Requirements 9.4**

### Property 27: State clearing on new detection
*For any* new detection initiated, the app should clear all previous detection results before processing the new image
**Validates: Requirements 10.3**

## Error Handling

### Error Categories

**1. Permission Errors**
- Camera permission denied
- Gallery permission denied
- Camera hardware unavailable

**Handling Strategy**:
- Display permission rationale dialog
- Provide deep link to app settings
- Disable affected features gracefully
- Show clear instructions for granting permissions

**2. Network Errors**
- Connection timeout
- No internet connection
- Server unreachable
- Request failed (4xx, 5xx)

**Handling Strategy**:
- Detect offline state before attempting requests
- Display specific error messages based on error type
- Provide retry button that preserves current state
- Implement exponential backoff for retries
- Show timeout message after 30 seconds

**3. Image Processing Errors**
- Unsupported image format
- Image too large
- Corrupted image file
- Failed to load image

**Handling Strategy**:
- Validate image format before processing
- Compress images exceeding size limits
- Display clear error messages with supported formats
- Provide option to select different image

**4. API Response Errors**
- Invalid response structure
- Missing required fields
- Unexpected data types
- No detections found

**Handling Strategy**:
- Validate response schema before processing
- Log malformed responses for debugging
- Display user-friendly messages
- Provide fallback UI for empty results

**5. Application Errors**
- Unexpected crashes
- State management errors
- Rendering errors

**Handling Strategy**:
- Implement error boundaries to catch React errors
- Log all errors with stack traces
- Display generic error message to user
- Provide "Start Over" button to reset state

### Error Boundary Implementation

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackScreen onReset={this.resetError} />;
    }
    return this.props.children;
  }
}
```

### Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Native Testing Library

**Coverage Areas**:
1. **Component Rendering**
   - Test that components render without crashing
   - Verify correct props are passed to child components
   - Test conditional rendering based on state

2. **User Interactions**
   - Test button press handlers
   - Test navigation actions
   - Test form input handling

3. **State Management**
   - Test state updates on actions
   - Test context provider values
   - Test reducer functions

4. **API Client**
   - Test request formatting
   - Test response parsing
   - Test error handling
   - Mock network requests with MSW or jest.mock

5. **Image Processing**
   - Test image compression
   - Test base64 conversion
   - Test dimension calculations

**Example Unit Tests**:
```typescript
describe('ApiClient', () => {
  it('should format detection request correctly', () => {
    const client = new ApiClient(config);
    const request = client.formatDetectionRequest(imageUri, 0.5, 0.45);
    expect(request).toHaveProperty('image');
    expect(request.confidenceThreshold).toBe(0.5);
  });

  it('should handle network timeout', async () => {
    const client = new ApiClient({ ...config, timeout: 100 });
    await expect(client.detectFood(request)).rejects.toThrow('timeout');
  });
});

describe('NutritionCard', () => {
  it('should display all nutrition values', () => {
    const nutrition = { calories: 450, protein: 25, carbs: 60, fat: 12 };
    const { getByText } = render(<NutritionCard nutrition={nutrition} />);
    expect(getByText('450')).toBeTruthy();
    expect(getByText('25g')).toBeTruthy();
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must include a comment tag in this format:
```typescript
// **Feature: mobile-app, Property {number}: {property_text}**
```

**Coverage Areas**:

1. **Calculation Properties**
   - Nutrition multiplication and summation
   - Confidence score percentage conversion
   - Bounding box coordinate calculations

2. **Data Transformation Properties**
   - API response parsing
   - Image format validation
   - State transitions

3. **Invariant Properties**
   - Number of detections = number of bounding boxes
   - Total nutrition = sum of individual nutritions
   - Disabled buttons during operations

4. **Error Handling Properties**
   - All errors produce error messages
   - Retry preserves current state
   - Invalid inputs are rejected

**Example Property Tests**:
```typescript
import fc from 'fast-check';

// **Feature: mobile-app, Property 17: Serving count multiplication**
describe('Nutrition calculation properties', () => {
  it('should multiply nutrition by serving count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // count
        fc.record({
          calories: fc.integer({ min: 0, max: 1000 }),
          protein: fc.integer({ min: 0, max: 100 }),
          carbohydrates: fc.integer({ min: 0, max: 200 }),
          fat: fc.integer({ min: 0, max: 100 })
        }), // per-serving nutrition
        (count, perServing) => {
          const result = calculateTotalNutrition(count, perServing);
          expect(result.calories).toBe(count * perServing.calories);
          expect(result.protein).toBe(count * perServing.protein);
          expect(result.carbohydrates).toBe(count * perServing.carbohydrates);
          expect(result.fat).toBe(count * perServing.fat);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-app, Property 18: Total nutrition summation**
describe('Total nutrition properties', () => {
  it('should sum nutrition across all detections', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            nutrition: fc.record({
              calories: fc.integer({ min: 0, max: 1000 }),
              protein: fc.integer({ min: 0, max: 100 }),
              carbohydrates: fc.integer({ min: 0, max: 200 }),
              fat: fc.integer({ min: 0, max: 100 })
            }),
            count: fc.integer({ min: 1, max: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ), // array of detections
        (detections) => {
          const total = calculateTotalNutritionForAll(detections);
          
          const expectedCalories = detections.reduce(
            (sum, d) => sum + d.nutrition.calories * d.count, 0
          );
          const expectedProtein = detections.reduce(
            (sum, d) => sum + d.nutrition.protein * d.count, 0
          );
          
          expect(total.calories).toBe(expectedCalories);
          expect(total.protein).toBe(expectedProtein);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-app, Property 8: Bounding box rendering**
describe('Detection rendering properties', () => {
  it('should render exactly N bounding boxes for N detections', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            dishName: fc.string(),
            confidence: fc.float({ min: 0, max: 1 }),
            boundingBox: fc.record({
              x: fc.integer({ min: 0, max: 1000 }),
              y: fc.integer({ min: 0, max: 1000 }),
              width: fc.integer({ min: 10, max: 500 }),
              height: fc.integer({ min: 10, max: 500 })
            })
          }),
          { minLength: 0, maxLength: 20 }
        ), // array of detections
        (detections) => {
          const { getAllByTestId } = render(
            <DetectionOverlay detections={detections} />
          );
          const boxes = getAllByTestId('bounding-box');
          expect(boxes.length).toBe(detections.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-app, Property 4: Unsupported format rejection**
describe('Image validation properties', () => {
  it('should reject unsupported image formats', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('.bmp', '.gif', '.tiff', '.webp', '.svg'), // unsupported formats
        fc.string({ minLength: 1, maxLength: 20 }), // filename
        async (extension, filename) => {
          const imageUri = `file:///${filename}${extension}`;
          const result = await validateImageFormat(imageUri);
          expect(result.isValid).toBe(false);
          expect(result.error).toContain('supported formats');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Framework**: Detox (E2E testing for React Native)

**Test Scenarios**:
1. Complete camera capture flow
2. Complete gallery selection flow
3. Detection with successful result
4. Detection with error handling
5. Permission request flows
6. Offline behavior

**Example Integration Test**:
```typescript
describe('Detection Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete full detection flow from camera', async () => {
    await element(by.id('camera-button')).tap();
    await element(by.id('capture-button')).tap();
    await element(by.id('proceed-button')).tap();
    
    await waitFor(element(by.id('detection-results')))
      .toBeVisible()
      .withTimeout(10000);
    
    await expect(element(by.id('bounding-box'))).toBeVisible();
    await expect(element(by.id('nutrition-card'))).toBeVisible();
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All calculation and data transformation logic
- **Integration Test Coverage**: All critical user flows
- **Manual Testing**: Platform-specific UI/UX on real devices

## Deployment Strategy

### Build Configuration

**Android**:
```gradle
// android/app/build.gradle
android {
    compileSdkVersion 33
    defaultConfig {
        minSdkVersion 26  // Android 8.0
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
    
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        }
    }
}
```

**iOS**:
```ruby
# ios/Podfile
platform :ios, '13.0'

target 'VNFoodDetection' do
  use_react_native!
  
  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-Camera', :path => "#{permissions_path}/Camera"
  pod 'Permission-PhotoLibrary', :path => "#{permissions_path}/PhotoLibrary"
end
```

### Environment Setup

**Development**:
- Local API endpoint for testing
- Debug mode enabled
- Hot reloading enabled
- Detailed error messages

**Production**:
- VPS API endpoint
- Release mode with optimizations
- Error reporting service integration
- Minimal logging

### Release Process

**Android (Google Play Store)**:
1. Generate signed AAB: `cd android && ./gradlew bundleRelease`
2. Test on multiple devices and Android versions
3. Upload to Google Play Console
4. Complete store listing with screenshots
5. Submit for review

**iOS (App Store)**:
1. Archive in Xcode: Product → Archive
2. Validate app with App Store Connect
3. Upload to App Store Connect
4. Complete App Store listing
5. Submit for review

### Backend Deployment (VPS)

**Server Setup**:
```bash
# Install dependencies
apt-get update
apt-get install python3.8 python3-pip nginx

# Clone repository
git clone <repo-url>
cd vn-food-detection

# Install Python dependencies
pip3 install -r requirements.txt

# Download trained models
# Place models in models/ directory
```

**API Server** (FastAPI):
```python
# server/main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import torch
from PIL import Image
import io
import base64

app = FastAPI()

# Enable CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Load models on startup
@app.on_event("startup")
async def load_models():
    global yolo_model, efficientnet_model
    yolo_model = load_yolo_model("models/yolov10_detector.pt")
    efficientnet_model = load_efficientnet_model("models/efficientnet_b4_classifier.pth")

@app.post("/api/v1/detect")
async def detect_food(
    image: UploadFile = File(...),
    confidence_threshold: float = Form(0.5),
    iou_threshold: float = Form(0.45)
):
    try:
        # Read image
        image_bytes = await image.read()
        img = Image.open(io.BytesIO(image_bytes))
        
        # Run hybrid detection
        detections = hybrid_detect(img, yolo_model, efficientnet_model, 
                                   confidence_threshold, iou_threshold)
        
        # Calculate nutrition
        total_nutrition = calculate_total_nutrition(detections)
        
        return {
            "success": True,
            "data": {
                "detections": detections,
                "total_nutrition": total_nutrition,
                "processing_time": processing_time
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": "PROCESSING_ERROR",
            "message": str(e)
        }

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": True,
        "version": "1.0.0"
    }
```

**Run Server**:
```bash
# Development
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

# Production with Gunicorn
gunicorn server.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 10M;
    }
}
```

### Monitoring and Maintenance

**Mobile App**:
- Integrate crash reporting (Sentry, Firebase Crashlytics)
- Monitor API response times
- Track user engagement metrics
- Monitor app store reviews

**Backend**:
- Monitor server resource usage (CPU, RAM, GPU)
- Track API request rates and latency
- Log errors and exceptions
- Set up alerts for downtime

## Performance Considerations

### Mobile App Optimization

1. **Image Compression**: Compress images before upload to reduce bandwidth
2. **Lazy Loading**: Load components only when needed
3. **Memoization**: Use React.memo and useMemo for expensive computations
4. **Debouncing**: Debounce user interactions to prevent excessive API calls
5. **Caching**: Cache API responses for repeated requests (if applicable)

### Backend Optimization

1. **Model Loading**: Load models once on startup, not per request
2. **Batch Processing**: Process multiple images in batches if needed
3. **GPU Acceleration**: Use CUDA for faster inference
4. **Image Preprocessing**: Optimize image resizing and normalization
5. **Response Compression**: Enable gzip compression for API responses

## Security Considerations

1. **HTTPS**: Use HTTPS for all API communication
2. **Input Validation**: Validate all inputs on both client and server
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **File Size Limits**: Enforce maximum file size for uploads
5. **Error Messages**: Don't expose sensitive information in error messages
6. **API Keys**: Store API keys securely using environment variables
7. **Code Obfuscation**: Enable ProGuard (Android) and code obfuscation (iOS)

## Future Enhancements

1. **Offline Mode**: Cache models for on-device inference
2. **Multi-language Support**: Add Vietnamese language option
3. **Social Sharing**: Share detection results to social media
4. **History**: Add optional local history with user consent
5. **Dietary Tracking**: Track daily nutrition intake
6. **Recipe Suggestions**: Suggest recipes based on detected ingredients
7. **AR Overlay**: Real-time detection with AR camera overlay
8. **Voice Commands**: Voice-activated detection
