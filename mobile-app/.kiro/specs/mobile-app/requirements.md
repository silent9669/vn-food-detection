# Requirements Document

## Introduction

This document specifies the requirements for a cross-platform mobile application built with React Native that enables users to detect and classify Vietnamese food items using trained machine learning models. The application will allow users to capture or select images, perform inference using the hybrid YOLOv10 + EfficientNet detection system, and display nutritional information. The app will be deployable to both Google Play Store (Android) and Apple App Store (iOS).

## Glossary

- **Mobile_App**: The React Native application that runs on iOS and Android devices
- **Inference_Service**: The backend service that processes images using trained ML models and returns detection results
- **Detection_Result**: The output containing identified food items, bounding boxes, confidence scores, and nutritional data
- **Model_API**: The REST API endpoint that accepts images and returns detection results
- **Image_Capture**: The process of taking a photo using the device camera
- **Image_Selection**: The process of choosing an existing photo from the device gallery
- **Nutrition_Display**: The UI component showing calculated nutritional information (calories, protein, carbs, fat)
- **Hybrid_Detection**: The combined YOLOv10 + EfficientNet inference pipeline
- **Bounding_Box**: The rectangular region indicating detected food item location
- **Confidence_Score**: The probability value (0-1) indicating detection certainty

## Requirements

### Requirement 1

**User Story:** As a user, I want to capture photos of Vietnamese food using my phone camera, so that I can identify the dishes and get nutritional information.

#### Acceptance Criteria

1. WHEN a user opens the camera interface THEN the Mobile_App SHALL display a live camera preview with a capture button
2. WHEN a user taps the capture button THEN the Mobile_App SHALL take a photo and store it temporarily in device memory
3. WHEN a photo is captured THEN the Mobile_App SHALL display the captured image with options to retry or proceed with detection
4. WHEN the device camera is unavailable THEN the Mobile_App SHALL display an error message and disable the camera capture feature
5. WHEN camera permissions are denied THEN the Mobile_App SHALL prompt the user to grant camera access with clear instructions

### Requirement 2

**User Story:** As a user, I want to select existing photos from my device gallery, so that I can analyze food images I've already taken.

#### Acceptance Criteria

1. WHEN a user taps the gallery button THEN the Mobile_App SHALL open the device photo gallery interface
2. WHEN a user selects an image from the gallery THEN the Mobile_App SHALL load the selected image into the application
3. WHEN the selected image is loaded THEN the Mobile_App SHALL display the image with an option to proceed with detection
4. WHEN gallery permissions are denied THEN the Mobile_App SHALL prompt the user to grant photo library access
5. WHERE the selected image format is unsupported THEN the Mobile_App SHALL display an error message indicating the supported formats

### Requirement 3

**User Story:** As a user, I want the app to detect and identify Vietnamese food items in my images, so that I can learn what dishes are present.

#### Acceptance Criteria

1. WHEN a user submits an image for detection THEN the Mobile_App SHALL send the image to the Inference_Service via the Model_API
2. WHEN the Inference_Service processes the image THEN the Mobile_App SHALL display a loading indicator with progress feedback
3. WHEN the Detection_Result is received THEN the Mobile_App SHALL parse and validate the response data structure
4. WHEN the detection completes successfully THEN the Mobile_App SHALL display the image with Bounding_Box overlays for each detected food item
5. WHEN multiple food items are detected THEN the Mobile_App SHALL display distinct Bounding_Box regions with unique identifiers for each item
6. WHEN a detection fails due to network error THEN the Mobile_App SHALL display an error message and provide a retry option
7. WHEN the Inference_Service returns an error response THEN the Mobile_App SHALL display the error message to the user

### Requirement 4

**User Story:** As a user, I want to see the names and confidence scores of detected food items, so that I can verify the accuracy of the detection.

#### Acceptance Criteria

1. WHEN Detection_Result contains identified food items THEN the Mobile_App SHALL display the Vietnamese dish name for each detected item
2. WHEN displaying food names THEN the Mobile_App SHALL show the Confidence_Score as a percentage next to each dish name
3. WHEN multiple instances of the same dish are detected THEN the Mobile_App SHALL display the count for each unique dish type
4. WHEN a Confidence_Score is below 50 percent THEN the Mobile_App SHALL visually indicate low confidence with a warning color
5. WHEN the user taps on a detected item THEN the Mobile_App SHALL highlight the corresponding Bounding_Box on the image

### Requirement 5

**User Story:** As a user, I want to view nutritional information for detected food items, so that I can track my dietary intake.

#### Acceptance Criteria

1. WHEN Detection_Result includes nutritional data THEN the Mobile_App SHALL display total calories, protein, carbohydrates, and fat
2. WHEN multiple servings of the same dish are detected THEN the Mobile_App SHALL calculate nutrition as count multiplied by per-serving values
3. WHEN displaying total nutrition THEN the Mobile_App SHALL sum the nutritional values across all detected food items
4. WHEN the user taps on the Nutrition_Display THEN the Mobile_App SHALL show a detailed breakdown per detected dish
5. WHEN nutritional data is unavailable for a detected item THEN the Mobile_App SHALL display a message indicating missing data

### Requirement 6

**User Story:** As a user, I want the app to work smoothly on both Android and iOS devices, so that I can use it regardless of my phone platform.

#### Acceptance Criteria

1. WHEN the Mobile_App is built for Android THEN the system SHALL produce an APK or AAB file compatible with Android 8.0 and above
2. WHEN the Mobile_App is built for iOS THEN the system SHALL produce an IPA file compatible with iOS 13.0 and above
3. WHEN the Mobile_App runs on Android THEN the system SHALL follow Material Design guidelines for UI components
4. WHEN the Mobile_App runs on iOS THEN the system SHALL follow Human Interface Guidelines for UI components
5. WHEN platform-specific features are required THEN the Mobile_App SHALL use React Native platform detection to provide appropriate implementations

### Requirement 7

**User Story:** As a user, I want the app to handle errors gracefully, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a network request fails THEN the Mobile_App SHALL display a user-friendly error message with the failure reason
2. WHEN the device is offline THEN the Mobile_App SHALL detect the offline state and inform the user before attempting detection
3. WHEN an image upload fails THEN the Mobile_App SHALL provide a retry button without requiring the user to recapture the image
4. WHEN the Inference_Service is unavailable THEN the Mobile_App SHALL display a message indicating the service is temporarily down
5. WHEN an unexpected error occurs THEN the Mobile_App SHALL log the error details and display a generic error message to the user

### Requirement 8

**User Story:** As a user, I want the app to respond quickly and provide feedback during processing, so that I know the app is working.

#### Acceptance Criteria

1. WHEN an image is being uploaded THEN the Mobile_App SHALL display an upload progress indicator
2. WHEN the Inference_Service is processing the image THEN the Mobile_App SHALL display an animated loading indicator
3. WHEN detection completes THEN the Mobile_App SHALL display results within 500 milliseconds of receiving the response
4. WHEN the app is performing any operation THEN the Mobile_App SHALL prevent duplicate submissions by disabling action buttons
5. WHEN a long-running operation exceeds 30 seconds THEN the Mobile_App SHALL display a timeout message and allow the user to cancel

### Requirement 9

**User Story:** As a developer, I want to configure the backend API endpoint, so that I can switch between development, staging, and production environments.

#### Acceptance Criteria

1. WHEN the Mobile_App is built THEN the system SHALL read the Model_API endpoint URL from environment configuration
2. WHEN the environment is set to development THEN the Mobile_App SHALL use the development API endpoint
3. WHEN the environment is set to production THEN the Mobile_App SHALL use the production API endpoint
4. WHERE API authentication is required THEN the Mobile_App SHALL include authentication tokens in all Model_API requests
5. WHEN the API endpoint configuration is invalid THEN the Mobile_App SHALL display an error during startup

### Requirement 10

**User Story:** As a user, I want to quickly demo the food detection capability, so that I can showcase the Vietnamese food recognition system.

#### Acceptance Criteria

1. WHEN the Mobile_App launches THEN the system SHALL display a simple interface with camera and gallery options
2. WHEN a detection completes THEN the Mobile_App SHALL display results without requiring user accounts or authentication
3. WHEN a user performs a new detection THEN the Mobile_App SHALL clear previous results and display the new detection
4. WHEN the app is closed THEN the Mobile_App SHALL not persist any detection results or user data
5. WHERE the user wants to share results THEN the Mobile_App SHALL provide a screenshot or share option for the current detection view
