# Vietnamese Food Detection Mobile App

A cross-platform React Native mobile application for detecting and classifying Vietnamese food items using hybrid YOLOv10 + EfficientNet models.

## Features

- 📸 Camera capture and gallery selection
- 🍜 Vietnamese food detection with 97%+ accuracy
- 📊 Nutritional information display
- 🎯 Bounding box visualization
- 📱 Cross-platform (iOS & Android)
- ⚡ Real-time inference via VPS backend

## Prerequisites

- Node.js >= 20
- React Native development environment
  - For iOS: Xcode, CocoaPods
  - For Android: Android Studio, JDK
- VPS with trained models deployed

## Installation

```bash
# Install dependencies
npm install

# iOS only - install pods
cd ios && pod install && cd ..
```

## Configuration

Create `.env` file with your API endpoint:

```
API_BASE_URL=https://your-vps-domain.com
API_TIMEOUT=30000
MAX_IMAGE_SIZE=5242880
IMAGE_QUALITY=0.8
```

## Running the App

### Development

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Production Build

**Android:**
```bash
cd android
./gradlew bundleRelease
```

**iOS:**
```bash
# Open in Xcode
xed -b ios

# Then: Product → Archive
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # API client, image processing
├── types/          # TypeScript interfaces
├── utils/          # Utility functions
└── navigation/     # Navigation configuration
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

## Tech Stack

- React Native 0.82
- TypeScript
- React Navigation
- React Native Paper
- Axios
- react-native-vision-camera
- react-native-image-picker
- react-native-config

## License

MIT
