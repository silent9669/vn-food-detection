# src/settings.py
import torch
import os

# General Settings
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
NUM_WORKERS = 2
PIN_MEMORY = True

# Dataset paths
CLASSIFICATION_DATA_DIR = "data_master/raw_images"
DETECTION_DATA_DIR = "data_master/detection_dataset"
LABELS_CSV_PATH = "data_master/labels.csv"

# --- EfficientNet_B4 Settings ---
EFFICIENTNET_MODEL_NAME = "efficientnet_b4"

# Auto-detect EfficientNet model path (supports both naming conventions)
_efficientnet_paths = [
    "models/food_classifier.pth",
    "models/efficientnet_b4_classifier.pth"
]
EFFICIENTNET_CHECKPOINT = None
for path in _efficientnet_paths:
    if os.path.exists(path):
        EFFICIENTNET_CHECKPOINT = path
        break
if EFFICIENTNET_CHECKPOINT is None:
    # Default to new naming convention
    EFFICIENTNET_CHECKPOINT = "models/efficientnet_b4_classifier.pth"

EFFICIENTNET_TRAIN = {
    "batch_size": 32,
    "learning_rate_classifier": 1e-3,
    "learning_rate_backbone": 1e-5,
    "epochs": 25,
    "unfreeze_blocks": 2, # Number of blocks in EfficientNet to unfreeze for fine-tuning
    "patience": 5, # Early stopping patience
}


# --- YOLOv10 Settings ---
YOLO_MODEL_NAME = "yolov10n" # Example: yolov10n, yolov10s, etc.
YOLO_CHECKPOINT = "models/yolov10_detector.pt"

YOLO_TRAIN = {
    "batch_size": 16,
    "learning_rate": 3e-4,
    "epochs": 50,
    "img_size": 640,
    "patience": 10,
}

# --- Validation Settings ---
VALIDATION = {
    "conf_threshold": 0.5, # Confidence threshold for detection
    "iou_threshold": 0.45, # IoU threshold for NMS
}

# --- Nutrition Calculation ---
# This would be loaded from labels.csv, but can have defaults
NUTRITION_DATA = {
    "calories": "calories",
    "protein": "protein",
    "carbs": "carbs",
    "fat": "fats",
}
