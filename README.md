# 🍜 Hybrid Vietnamese Food Detection System

> Combining YOLOv10 + EfficientNet_B4 for 97%+ accuracy in Vietnamese food recognition with automatic nutrition calculation

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
food_detection/
├── menu.sh                    # Interactive menu (START HERE!)
├── setup.sh                   # One-command installation
├── YOLO_DATASET.md            # YOLO annotation guide
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
├── results/                   # Evaluation results (auto-created)
└── logs/                      # Training logs (auto-created)
```

---

## 💡 Key Features

| Feature | Description |
|---------|-------------|
| **Hybrid Detection** | YOLOv10 detects + EfficientNet refines = 97%+ accuracy |
| **Interactive Menu** | Beautiful CLI interface with model checking |
| **Auto Model Detection** | Menu recognizes existing models, prevents overwriting |
| **Real-time Training** | Streamlit dashboards with live metrics |
| **Smart Validation** | Hybrid mode as default for best results |
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

## 📞 Contact

**Email:** phuc.dangcs2007@hcmut.edu.vn

---
