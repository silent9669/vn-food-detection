# Vietnamese Food Detection - Mobile App

This folder contains the React Native mobile application and API backend for Vietnamese food detection.

## 📁 Contents

```
mobile-app/
├── VNFoodDetection/          # React Native app
│   ├── src/                  # App source code
│   ├── android/              # Android native
│   ├── ios/                  # iOS native
│   ├── __tests__/            # Tests
│   └── package.json
│
├── server/                    # FastAPI backend
│   ├── main.py               # API server
│   ├── requirements.txt      # Dependencies
│   └── README.md
│
└── .kiro/                     # Kiro specs
    └── specs/mobile-app/
        ├── requirements.md    # EARS requirements
        ├── design.md          # Design document
        └── tasks.md           # Implementation tasks
```

## 🚀 Quick Start

### Mobile App

#### Installation
```bash
cd VNFoodDetection
npm install

# iOS
cd ios && pod install && cd ..
```

#### Run
```bash
# iOS
npm run ios

# Android
npm run android
```

#### Test
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

### API Backend

#### Installation
```bash
cd server
pip install -r requirements.txt
```

#### Run
```bash
python main.py

# Or with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📱 Mobile App Features

- ✅ Camera capture & gallery selection
- ✅ Real-time food detection
- ✅ Bounding boxes with confidence scores
- ✅ Nutritional information display
- ✅ Share detection results
- ✅ Error handling & retry logic
- ✅ Cross-platform (iOS/Android)
- ✅ 69+ tests with property-based testing

## 🚀 API Backend Features

- ✅ FastAPI with CORS
- ✅ EfficientNet model inference
- ✅ Nutrition data lookup
- ✅ Base64 image support
- ✅ Error handling & validation
- ✅ Health check endpoint

## 🔗 API Endpoints

### POST /api/v1/detect
Detect food items in an image

**Request:**
```json
{
  "image": "base64_encoded_image",
  "confidence_threshold": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detections": [...],
    "total_nutrition": {...},
    "processing_time": 1.23
  }
}
```

### GET /api/v1/health
Health check endpoint

## 📊 Development Status

| Component | Status | Progress |
|-----------|--------|----------|
| Mobile App | ✅ Complete | 33/41 tasks (80%) |
| API Backend | ✅ Complete | 100% |
| Android Config | ✅ Complete | 100% |
| iOS Config | ⏳ Pending | Next |

## 🧪 Testing

```bash
cd VNFoodDetection

# Run all tests
npm test

# Run specific test
npm test -- ResultsScreen.test.tsx

# Coverage
npm test -- --coverage
```

**Test Stats:**
- 20 test suites
- 69+ tests passing
- Property-based testing with fast-check
- Unit tests with Jest

## 🏗️ Build

### Android
```bash
cd VNFoodDetection/android

# Debug
./gradlew assembleDebug

# Release
./gradlew bundleRelease
```

### iOS
```bash
cd VNFoodDetection/ios

# Debug
xcodebuild -workspace VNFoodDetection.xcworkspace -scheme VNFoodDetection -configuration Debug

# Release
xcodebuild archive -workspace VNFoodDetection.xcworkspace -scheme VNFoodDetection
```

See `VNFoodDetection/BUILD_INSTRUCTIONS.md` for detailed build instructions.

## 🔧 Configuration

### Environment Variables

**Development** (`.env.development`):
```
API_BASE_URL=http://localhost:8000
```

**Production** (`.env.production`):
```
API_BASE_URL=https://your-vps-domain.com
```

### Backend Configuration

Copy trained models and data:
```bash
# From training folder
cp ../training/models/efficientnet_b4_classifier.pth server/models/
cp ../training/data_master/labels.csv server/data_master/
```

## 📖 Documentation

- **App README:** `VNFoodDetection/README.md`
- **Backend README:** `server/README.md`
- **Build Instructions:** `VNFoodDetection/BUILD_INSTRUCTIONS.md`
- **Requirements:** `.kiro/specs/mobile-app/requirements.md`
- **Design:** `.kiro/specs/mobile-app/design.md`
- **Tasks:** `.kiro/specs/mobile-app/tasks.md`

## 🎯 Tech Stack

### Mobile App
- React Native 0.82.1
- TypeScript
- React Navigation
- React Native Paper
- Jest + fast-check
- Axios

### Backend
- FastAPI
- PyTorch
- Pillow
- Pandas
- Uvicorn

## 🚀 Deployment

### Backend (VPS)
```bash
# 1. Set up VPS (Ubuntu/Debian)
# 2. Install dependencies
pip install -r server/requirements.txt

# 3. Copy models
scp ../training/models/*.pth user@vps:/path/to/server/models/

# 4. Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker server.main:app
```

### Mobile App
1. Build release versions (Android/iOS)
2. Test on physical devices
3. Submit to app stores

## 📞 Support

For mobile app issues:
- Check `VNFoodDetection/README.md`
- Run `npm test` to verify setup
- Check React Native documentation

For backend issues:
- Check `server/README.md`
- Verify models are loaded
- Check API logs

## 🎓 Learning Resources

- **React Native:** https://reactnative.dev/
- **FastAPI:** https://fastapi.tiangolo.com/
- **Spec-driven Development:** `.kiro/specs/mobile-app/`
