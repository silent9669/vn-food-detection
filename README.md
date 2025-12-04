# 🍜 Vietnamese Food Detection

AI-powered mobile app for detecting Vietnamese dishes with nutritional information.

## 📊 Project Architecture

```mermaid
graph TB
    subgraph "Mobile App (React Native)"
        A[📱 iOS/Android App] --> B[Camera/Gallery]
        B --> C[Image Capture]
        C --> D[API Client]
    end
    
    subgraph "Backend (FastAPI)"
        D --> E[🚀 Railway Server]
        E --> F[EfficientNet B4]
        F --> G[Classification]
        G --> H[Nutrition Lookup]
    end
    
    subgraph "ML Training"
        I[📊 Dataset] --> J[Training Pipeline]
        J --> K[YOLOv10 + EfficientNet]
        K --> L[Trained Models]
        L --> F
    end
    
    H --> M[📱 Results Display]
    M --> N[Share Results]
    
    style A fill:#4CAF50
    style E fill:#FF6B6B
    style K fill:#4ECDC4
```

## 🌿 Branch Structure

```
vn-food-detection/
│
├── 📱 mobile-app          # React Native + Backend
│   ├── VNFoodDetection/   # Mobile app
│   └── server/            # FastAPI + Model
│
└── 🧠 training            # ML Training Pipeline
    ├── src/               # Training scripts
    ├── data_master/       # Dataset (30 classes)
    └── models/            # Trained models
```

## 🚀 Quick Start

### Mobile App Development
```bash
git clone -b mobile-app https://github.com/silent9669/vn-food-detection.git
cd vn-food-detection/mobile-app
```

### ML Training
```bash
git clone -b training https://github.com/silent9669/vn-food-detection.git
cd vn-food-detection
./menu.sh
```

## 📱 Mobile App Features

```mermaid
flowchart LR
    A[🏠 Home] --> B{Choose Input}
    B -->|Camera| C[📸 Capture]
    B -->|Gallery| D[🖼️ Select]
    C --> E[🔄 Processing]
    D --> E
    E --> F[✅ Results]
    F --> G[📊 Nutrition Info]
    F --> H[📤 Share]
    
    style A fill:#E3F2FD
    style F fill:#C8E6C9
    style G fill:#FFF9C4
```

**Tech Stack:**
- React Native + TypeScript
- Platform-specific UI (iOS/Android)
- 69+ tests (92% pass rate)
- Railway backend deployment

## 🧠 ML Pipeline

```mermaid
flowchart TD
    A[Raw Images] --> B[Data Augmentation]
    B --> C{Training}
    C -->|Classification| D[EfficientNet B4]
    C -->|Detection| E[YOLOv10]
    D --> F[97%+ Accuracy]
    E --> F
    F --> G[Production Model]
    G --> H[Mobile Backend]
    
    style A fill:#FFE0B2
    style F fill:#C8E6C9
    style H fill:#B2DFDB
```

**Capabilities:**
- 30 Vietnamese food classes
- 17,581 training images
- Hybrid detection system
- Nutrition calculation

## 📊 System Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant M as 📱 Mobile App
    participant B as 🚀 Backend
    participant AI as 🤖 AI Model
    
    U->>M: Take/Select Photo
    M->>B: Upload Image
    B->>AI: Process Image
    AI->>AI: EfficientNet Classification
    AI->>B: Detection Results
    B->>B: Calculate Nutrition
    B->>M: Return Results
    M->>U: Display Results + Nutrition
    U->>M: Share Results
```

## 🎯 Supported Dishes (30 Classes)

| Category | Examples |
|----------|----------|
| **Noodles** | Phở, Bún bò Huế, Bún chả |
| **Rice** | Cơm tấm, Cơm gà |
| **Bread** | Bánh mì |
| **Cakes** | Bánh xèo, Bánh cuốn, Bánh bèo |
| **Rolls** | Gỏi cuốn, Nem chua |
| **Others** | 20+ more dishes |

## 📈 Project Status

```mermaid
pie title Development Progress
    "Complete" : 88
    "Remaining" : 12
```

**Completed (36/41 tasks):**
- ✅ Mobile app development
- ✅ Backend API with ML model
- ✅ Platform-specific UI
- ✅ Railway deployment ready
- ✅ Testing & documentation

**Remaining (5 tasks):**
- 🔄 Railway deployment
- 🔄 Android release build
- 🔄 iOS release build
- 🔄 App store listings
- 🔄 Final testing

## 🔗 Links

- **Mobile App Branch:** [mobile-app](https://github.com/silent9669/vn-food-detection/tree/mobile-app)
- **Training Branch:** [training](https://github.com/silent9669/vn-food-detection/tree/training)
- **Documentation:** See branch-specific docs

## 📞 Contact

**Email:** phuc.dangcs2007@hcmut.edu.vn

---

<div align="center">
  <b>🍜 Detect • Analyze • Track</b>
  <br>
  <i>Vietnamese Food Detection with AI</i>
</div>
