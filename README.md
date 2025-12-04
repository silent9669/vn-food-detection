# 🍜 Vietnamese Food Detection Project

> AI-powered Vietnamese food detection with mobile app and ML training pipeline

---

## 📱 Project Branches

This project is organized into two main branches:

### 🎯 **mobile-app** Branch
Complete React Native mobile application with backend API
- Cross-platform app (iOS & Android)
- AI-powered food detection
- Nutritional information
- Share functionality
- **[View Mobile App →](https://github.com/silent9669/vn-food-detection/tree/mobile-app)**

### 🧠 **training** Branch  
Machine learning training pipeline and models
- YOLOv10 + EfficientNet_B4 hybrid system
- 30 Vietnamese food classes
- Training dashboards and tools
- **[View Training Code →](https://github.com/silent9669/vn-food-detection/tree/training)**

---

## 🚀 Quick Start

### For Mobile App Development
```bash
git clone -b mobile-app https://github.com/silent9669/vn-food-detection.git
cd vn-food-detection
# Follow mobile-app/README.md
```

### For ML Training
```bash
git clone -b training https://github.com/silent9669/vn-food-detection.git
cd vn-food-detection
chmod +x setup.sh
./setup.sh
./menu.sh
```

---

## 📊 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | Python 3.8+ | Development |
| **Classification** | EfficientNet_B4 (PyTorch) | Single dish recognition (95%+ accuracy) |
| **Detection** | YOLOv10 (Ultralytics) | Multi-instance detection (85%+ mAP) |
| **Hybrid System** | YOLO + EfficientNet | Combined inference (97%+ accuracy) |
| **Training UI** | Streamlit | Interactive dashboards with real-time metrics |
| **Data Processing** | OpenCV, Pillow, Pandas | Image processing & data handling |
| **Augmentation** | torchvision.transforms | Training data augmentation |
| **GPU Acceleration** | CUDA, Mixed Precision (AMP) | Fast training & inference |

---

## 🎯 System Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Input Image                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        Single Dish              Multi-Dish
                │                     │
                v                     v
        ┌──────────────┐      ┌──────────────┐
        │ EfficientNet │      │   YOLOv10    │
        │ Classify     │      │   Detect     │
        └──────┬───────┘      └──────┬───────┘
               │                     │
               │              ┌──────┴──────┐
               │              │ Crop regions│
               │              └──────┬──────┘
               │                     │
               │              ┌──────v──────┐
               │              │ EfficientNet│
               │              │ Refine each │
               │              └──────┬──────┘
               │                     │
               └──────────┬──────────┘
                          v
                ┌─────────────────────┐
                │ Nutrition Calculator│
                │ Count × Nutrients   │
                └─────────┬───────────┘
                          v
            ┌─────────────────────────────┐
            │        Results Display      │
            │ • Bounding boxes            │
            │ • Dish names & confidence   │
            │ • Serving counts            │
            │ • Total nutrition           │
            └─────────────────────────────┘
```

---

## 📁 Project Structure

```
vn-food-detection/
├── menu.sh                    # Interactive menu (START HERE!)
├── setup.sh                   # One-command installation
├── requirements.txt           # Dependencies
│
├── src/                       # Source code
│   ├── app.py                 # Main CLI application
│   ├── verify_setup.py        # System verification
│   ├── model.py              # EfficientNet model
│   ├── yolo_model.py         # YOLOv10 wrapper
│   ├── hybrid_inference.py   # Hybrid detection system
│   ├── train.py              # Training dashboard (Streamlit)
│   ├── validate.py           # Validation interface (Streamlit)
│   ├── evaluate_model.py     # Evaluation metrics (Streamlit)
│   ├── data_loader.py        # Dataset loading & augmentation
│   ├── prepare_yolo_dataset.py  # Dataset preparation
│   ├── settings.py           # Configuration
│   └── utils.py              # Utilities
│
├── data_master/
│   ├── raw_images/           # Classification images (30 classes, 17,581 images)
│   ├── detection_dataset/    # YOLO format dataset
│   │   ├── images/
│   │   │   ├── train/       # Training images
│   │   │   └── val/         # Validation images
│   │   └── labels/
│   │       ├── train/       # YOLO annotations (.txt)
│   │       └── val/         # YOLO annotations (.txt)
│   └── labels.csv            # Nutrition data
│
├── models/                    # Trained models (auto-created)
│   ├── efficientnet_b4_classifier.pth
│   └── yolov10_detector.pt
│
└── results/                   # Evaluation results (auto-created)
```

---

## 💡 Key Features

| Feature | Description |
|---------|-------------|
| **Hybrid Detection** | YOLOv10 detects + EfficientNet refines = 97%+ accuracy |
| **Dynamic GUI** | Switch models/modes without restarting - all in GUI |
| **Model Caching** | Instant switching after first load (no reload delays) |
| **Real-time Training** | Streamlit dashboards with live metrics |
| **Adjustable Parameters** | Tune learning rates, thresholds in real-time |
| **Three Detection Modes** | Hybrid, YOLO-only, or EfficientNet-only |
| **Nutrition Tracking** | Automatic calculation: `Total = Σ(Count × Nutrients)` |
| **Multi-Instance** | Detect & count multiple food items per image |
| **Vietnamese Cuisine** | 30 authentic dishes with variations |
| **Production Ready** | Error handling, checkpointing, early stopping |

---

## 🧪 Training Details

### EfficientNet (Classification)

**Data Augmentation:**
- Random horizontal flip
- Random rotation (-30° to 30°)
- Color jitter (brightness, contrast, saturation, hue)
- Random perspective transform
- Random affine transform

**Training Strategy:**
- Transfer learning from ImageNet
- Differential learning rates (classifier vs backbone)
- Mixed precision training (AMP)
- ReduceLROnPlateau scheduler
- Early stopping
- Fine-tuning with selective layer unfreezing

**Configurable in GUI:**
- Learning rate (classifier): default 1e-3
- Learning rate (backbone): default 1e-5
- Epochs: default 25
- Batch size: default 32
- Unfreeze blocks: 0-7 (0 = classifier only)
- Early stopping patience: default 5

**Outputs:**
- Model: `models/efficientnet_b4_classifier.pth`
- Metrics: Accuracy, precision, recall, F1-score
- Visualizations: Loss curves, confusion matrix

### YOLOv10 (Detection)

**Training Features:**
- Automatic anchors
- Mosaic augmentation
- Multi-scale training
- Batch normalization
- CSPDarknet backbone

**Configurable in GUI:**
- Learning rate: default 3e-4
- Epochs: default 50
- Batch size: default 16
- Image size: default 640
- Early stopping patience: default 10
- Data loading workers: configurable

**Outputs:**
- Model: `models/yolov10_detector.pt`
- Metrics: mAP@0.5, mAP@0.5:0.95, precision, recall
- Visualizations: Training curves, confusion matrix, P/R curves

### Hybrid System

**Inference Pipeline:**
1. YOLO detects all food items (bounding boxes)
2. Crop each detected region
3. EfficientNet classifies each crop
4. Compare YOLO vs EfficientNet predictions
5. Use EfficientNet if confidence > 0.7
6. Aggregate results & calculate nutrition

**Adjustable in GUI:**
- Confidence threshold: 0.0 - 1.0 (default 0.5)
- IoU threshold: 0.0 - 1.0 (default 0.45)

---

## 🎯 Nutrition Calculation

Formula:
```
Total_Nutrition = Σ (Count_i × Nutrition_per_Serving_i)
```

Example:
- 2 × Phở tái (450 cal each) = 900 cal
- 1 × Bánh bèo (120 cal) = 120 cal
- **Total: 1,020 calories**

Tracks: Calories, Protein (g), Carbohydrates (g), Fat (g)

---

## 📈 Dataset Details

**Your Dataset:**
- **30 Vietnamese food classes**
- **17,581 total images**
- **~586 images per class**
- **Nutrition data included** in labels.csv

**Classes include:**
Phở, Bánh mì, Bún bò Huế, Cơm tấm, Bánh xèo, Bánh cuốn, Gỏi cuốn, Nem chua, Bánh bèo, Bánh khọt, and 20 more authentic Vietnamese dishes.

---

## 📞 Contact

**Email:** phuc.dangcs2007@hcmut.edu.vn

---

