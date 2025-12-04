# Vietnamese Food Detection - ML Training

This folder contains all machine learning training code and data for the Vietnamese Food Detection system.

## 📁 Contents

```
training/
├── src/                       # Training source code
│   ├── train.py              # Training dashboard (Streamlit)
│   ├── model.py              # EfficientNet model
│   ├── yolo_model.py         # YOLOv10 wrapper
│   ├── hybrid_inference.py   # Hybrid detection
│   ├── evaluate_model.py     # Evaluation metrics
│   ├── validate.py           # Validation interface
│   ├── data_loader.py        # Dataset loading
│   ├── prepare_yolo_dataset.py  # Dataset preparation
│   ├── settings.py           # Configuration
│   └── utils.py              # Utilities
│
├── data_master/
│   ├── raw_images/           # 30 classes, 17,581 images
│   ├── detection_dataset/    # YOLO format dataset
│   └── labels.csv            # Nutrition data
│
├── models/                    # Trained models
│   └── efficientnet_b4_classifier.pth
│
├── results/                   # Training results
│
├── requirements.txt           # Python dependencies
├── packages.txt              # System packages
├── setup.sh                  # Installation script
└── menu.sh                   # Interactive menu
```

## 🚀 Quick Start

### Installation
```bash
# Run setup script
chmod +x setup.sh
./setup.sh

# Or manually
pip install -r requirements.txt
```

### Training

#### Interactive Menu (Recommended)
```bash
./menu.sh
```

#### Direct Training
```bash
# Train EfficientNet
python src/train.py

# Evaluate model
python src/evaluate_model.py

# Validate model
python src/validate.py
```

## 📊 Dataset

- **30 Vietnamese food classes**
- **17,581 total images** (~586 per class)
- **Nutrition data** in labels.csv

**Classes include:**
Phở, Bánh mì, Bún bò Huế, Cơm tấm, Bánh xèo, Bánh cuốn, Gỏi cuốn, Nem chua, Bánh bèo, Bánh khọt, and 20 more.

## 🤖 Models

### EfficientNet B4 (Classification)
- **Input:** 380x380 RGB images
- **Output:** 30 classes
- **Accuracy:** 95%+
- **File:** `models/efficientnet_b4_classifier.pth`

### YOLOv10 (Detection)
- **Input:** 640x640 RGB images
- **Output:** Bounding boxes + classes
- **mAP:** 85%+
- **File:** `models/yolov10_detector.pt` (to be trained)

## 📈 Training Features

- Transfer learning from ImageNet
- Data augmentation (flip, rotate, color jitter)
- Mixed precision training (AMP)
- Early stopping
- Learning rate scheduling
- Real-time metrics with Streamlit

## 🔧 Configuration

Edit `src/settings.py` for:
- Learning rates
- Batch sizes
- Epochs
- Image sizes
- Data paths

## 📝 Outputs

### Models
- `models/efficientnet_b4_classifier.pth`
- `models/yolov10_detector.pt`

### Results
- `results/classification_report.txt`
- `results/confusion_matrix.png`
- Training curves and metrics

## 🎯 Nutrition Data

Format in `data_master/labels.csv`:
```csv
image_path,class_name,calories,protein,carbs,fats,portion_gram
```

Average nutrition values are calculated per class for the mobile app.

## 🔗 Integration

Trained models are used by:
1. **Mobile App Backend** (`../mobile-app/server/`)
2. **Hybrid Inference** (`src/hybrid_inference.py`)

## 📞 Support

For training issues, check:
- Python version: 3.8+
- CUDA availability for GPU training
- Dataset integrity
- Dependencies installed correctly

## 🎓 Tech Stack

- **PyTorch** - Deep learning framework
- **torchvision** - Model architectures
- **Ultralytics** - YOLOv10 implementation
- **Streamlit** - Training dashboards
- **OpenCV** - Image processing
- **Pandas** - Data handling
