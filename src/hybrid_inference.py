"""
Hybrid Inference System for Vietnamese Food Detection
Combines YOLOv10 detection with EfficientNet classification for enhanced accuracy.
"""

import os
import sys
import torch
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from typing import List, Dict, Tuple, Optional

# Add parent directory to path for imports to work in Streamlit Cloud
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.yolo_model import YOLODetector
from src.model import get_model
from src.utils import load_model
from src.data_loader import get_val_transforms


class HybridFoodDetector:
    """
    Hybrid detection system that combines:
    - YOLOv10 for multi-instance detection and localization
    - EfficientNet_B4 for refined classification of detected regions
    """

    def __init__(self, yolo_checkpoint, efficientnet_checkpoint, labels_csv,
                 device='cuda', conf_threshold=0.5, iou_threshold=0.45):
        """
        Initialize hybrid detector.

        Args:
            yolo_checkpoint: Path to trained YOLO model weights
            efficientnet_checkpoint: Path to trained EfficientNet model weights
            labels_csv: Path to labels CSV with nutrition data
            device: Device to run models on
            conf_threshold: Confidence threshold for YOLO detections
            iou_threshold: IoU threshold for NMS
        """
        self.device = device
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold

        # Load labels and nutrition data
        self.labels_df = pd.read_csv(labels_csv)
        self.class_names = sorted(self.labels_df['class_name'].unique().tolist())
        self.num_classes = len(self.class_names)
        self.idx_to_class = {i: name for i, name in enumerate(self.class_names)}
        self.class_to_idx = {name: i for i, name in enumerate(self.class_names)}

        # Initialize YOLO detector
        print(f"Loading YOLO model from {yolo_checkpoint}...")
        self.yolo_detector = YOLODetector(
            model_path=yolo_checkpoint,
            device=device
        )

        # Initialize EfficientNet classifier
        print(f"Loading EfficientNet model from {efficientnet_checkpoint}...")
        self.efficientnet_model = get_model(self.num_classes)
        self.efficientnet_model = load_model(
            self.efficientnet_model,
            efficientnet_checkpoint,
            device=device
        )
        self.efficientnet_model.eval()

        # Preprocessing transform for EfficientNet
        self.transform = get_val_transforms()

        print("Hybrid detector initialized successfully!")

    def detect_and_classify(self, image_path: str, use_hybrid: bool = True,
                           min_crop_size: int = 50) -> Tuple[List[Dict], Image.Image]:
        """
        Detect food items using YOLO and optionally refine with EfficientNet.

        Args:
            image_path: Path to input image
            use_hybrid: If True, refine YOLO predictions with EfficientNet
            min_crop_size: Minimum size for crops to be classified by EfficientNet

        Returns:
            Tuple of (detections_list, annotated_image)
            detections_list: List of detection dictionaries
        """
        # Load image
        image = Image.open(image_path).convert('RGB')

        # Run YOLO detection
        yolo_detections, yolo_result = self.yolo_detector.predict(
            image_path,
            conf_threshold=self.conf_threshold,
            iou_threshold=self.iou_threshold
        )

        final_detections = []

        # Process each detection
        for detection in yolo_detections:
            bbox = detection['bbox']
            yolo_class_name = detection['class_name']
            confidence = detection['confidence']

            # Refine with EfficientNet if hybrid mode is enabled
            if use_hybrid:
                # Crop detected region
                x1, y1, x2, y2 = [int(coord) for coord in bbox]
                crop = image.crop((x1, y1, x2, y2))

                # Only classify if crop is large enough
                if crop.width >= min_crop_size and crop.height >= min_crop_size:
                    # Classify with EfficientNet
                    efficientnet_class, efficientnet_conf = self._classify_crop(crop)

                    # Use EfficientNet prediction if confidence is high enough
                    # Otherwise, trust YOLO's prediction
                    if efficientnet_conf > 0.7:  # Threshold for trusting EfficientNet
                        final_class_name = efficientnet_class
                        final_confidence = (confidence + efficientnet_conf) / 2  # Average both
                        refined = True
                    else:
                        final_class_name = yolo_class_name
                        final_confidence = confidence
                        refined = False
                else:
                    final_class_name = yolo_class_name
                    final_confidence = confidence
                    refined = False
            else:
                final_class_name = yolo_class_name
                final_confidence = confidence
                refined = False

            final_detections.append({
                'class_name': final_class_name,
                'bbox': bbox,
                'confidence': final_confidence,
                'yolo_class': yolo_class_name,
                'refined_by_efficientnet': refined
            })

        # Create annotated image
        annotated_image = self._draw_detections(image.copy(), final_detections)

        return final_detections, annotated_image

    def _classify_crop(self, crop_image: Image.Image) -> Tuple[str, float]:
        """
        Classify a cropped image using EfficientNet.

        Args:
            crop_image: PIL Image of cropped region

        Returns:
            Tuple of (class_name, confidence)
        """
        # Preprocess
        preprocessed = self.transform(crop_image).unsqueeze(0).to(self.device)

        # Classify
        with torch.no_grad():
            outputs = self.efficientnet_model(preprocessed)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)

        class_name = self.idx_to_class[predicted_idx.item()]
        confidence_value = confidence.item()

        return class_name, confidence_value

    def _draw_detections(self, image: Image.Image, detections: List[Dict]) -> Image.Image:
        """Draw bounding boxes and labels on image."""
        draw = ImageDraw.Draw(image)

        # Try to load a font, fall back to default if not available
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        except:
            font = ImageFont.load_default()

        for detection in detections:
            bbox = detection['bbox']
            class_name = detection['class_name']
            confidence = detection['confidence']
            refined = detection.get('refined_by_efficientnet', False)

            # Draw bounding box
            x1, y1, x2, y2 = [int(coord) for coord in bbox]
            color = "green" if refined else "blue"
            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

            # Draw label
            label = f"{class_name} ({confidence:.2f})"
            if refined:
                label += " *"  # Mark refined predictions

            # Draw label background
            label_bbox = draw.textbbox((x1, y1 - 20), label, font=font)
            draw.rectangle(label_bbox, fill=color)
            draw.text((x1, y1 - 20), label, fill="white", font=font)

        return image

    def calculate_nutrition(self, detections: List[Dict],
                          nutrition_columns: Dict[str, str]) -> Dict[str, float]:
        """
        Calculate total nutrition from detections.

        Args:
            detections: List of detection dictionaries
            nutrition_columns: Dict mapping nutrient names to CSV column names

        Returns:
            Dict with total nutrition values
        """
        # Count servings per dish
        dish_counts = {}
        for detection in detections:
            class_name = detection['class_name']
            dish_counts[class_name] = dish_counts.get(class_name, 0) + 1

        # Calculate total nutrition
        total_nutrition = {col: 0.0 for col in nutrition_columns.values()}

        for class_name, count in dish_counts.items():
            # Get nutrition data for this dish
            dish_data = self.labels_df[self.labels_df['class_name'] == class_name]

            if len(dish_data) > 0:
                dish_nutrition = dish_data.iloc[0]

                for nutrient_key, col_name in nutrition_columns.items():
                    if col_name in dish_nutrition:
                        value = dish_nutrition[col_name]
                        # Handle missing or invalid values
                        if pd.notna(value):
                            total_nutrition[col_name] += float(value) * count

        return total_nutrition, dish_counts

    def classify_single_dish(self, image_path: str) -> Tuple[str, float, Dict]:
        """
        Classify a single dish image using EfficientNet only.

        Args:
            image_path: Path to input image

        Returns:
            Tuple of (class_name, confidence, nutrition_info)
        """
        image = Image.open(image_path).convert('RGB')

        # Classify
        class_name, confidence = self._classify_crop(image)

        # Get nutrition info
        nutrition_info = self.labels_df[
            self.labels_df['class_name'] == class_name
        ].iloc[0].to_dict()

        return class_name, confidence, nutrition_info
