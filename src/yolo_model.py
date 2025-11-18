"""
YOLOv10 Model Wrapper for Vietnamese Food Detection
Handles detection, training, and inference for multi-instance food detection.
"""

import os
import torch
from ultralytics import YOLO
from pathlib import Path
import yaml

class YOLODetector:
    """
    Wrapper class for YOLOv10 object detection model.
    Handles training, inference, and evaluation for Vietnamese food detection.
    """

    def __init__(self, model_path=None, model_name='yolov10n.pt', device='auto'):
        """
        Initialize YOLO detector.

        Args:
            model_path: Path to trained model weights, or None to load pretrained
            model_name: Base YOLO model name (yolov10n, yolov10s, yolov10m, etc.)
            device: Device to run model on ('auto', 'cuda', 'mps', or 'cpu')
        """
        # Auto-detect device if not specified
        if device == 'auto':
            import torch
            if torch.cuda.is_available():
                self.device = 'cuda'
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                self.device = 'mps'
            else:
                self.device = 'cpu'
        else:
            self.device = device

        if model_path and os.path.exists(model_path):
            print(f"Loading trained YOLO model from {model_path}")
            self.model = YOLO(model_path)
        else:
            print(f"Loading pretrained YOLO model: {model_name}")
            self.model = YOLO(model_name)

        # Move model to specified device
        self.model.to(device)

    def train(self, data_yaml, epochs=50, batch_size=16, img_size=640,
              learning_rate=0.001, patience=10, save_dir='runs/detect/train',
              workers=4, project='models', name='yolov10_detector'):
        """
        Train the YOLO model.

        Args:
            data_yaml: Path to dataset YAML configuration file
            epochs: Number of training epochs
            batch_size: Training batch size
            img_size: Input image size
            learning_rate: Initial learning rate
            patience: Early stopping patience
            save_dir: Directory to save training results
            workers: Number of data loading workers
            project: Project directory
            name: Experiment name

        Returns:
            Training results
        """
        print(f"Starting YOLOv10 training with {epochs} epochs...")

        # Train the model
        results = self.model.train(
            data=data_yaml,
            epochs=epochs,
            batch=batch_size,
            imgsz=img_size,
            lr0=learning_rate,
            patience=patience,
            device=self.device,
            workers=workers,
            project=project,
            name=name,
            save=True,
            plots=True,
            val=True
        )

        print(f"Training complete. Best weights saved.")
        return results

    def predict(self, image_path, conf_threshold=0.5, iou_threshold=0.45):
        """
        Run inference on a single image.

        Args:
            image_path: Path to input image
            conf_threshold: Confidence threshold for detections
            iou_threshold: IoU threshold for NMS

        Returns:
            List of detections with format:
            [{'class_id': int, 'class_name': str, 'bbox': [x1, y1, x2, y2],
              'confidence': float}, ...]
        """
        results = self.model.predict(
            source=image_path,
            conf=conf_threshold,
            iou=iou_threshold,
            device=self.device,
            verbose=False
        )

        detections = []
        for result in results:
            boxes = result.boxes
            for i in range(len(boxes)):
                detection = {
                    'class_id': int(boxes.cls[i].item()),
                    'class_name': result.names[int(boxes.cls[i].item())],
                    'bbox': boxes.xyxy[i].cpu().numpy().tolist(),
                    'confidence': float(boxes.conf[i].item())
                }
                detections.append(detection)

        return detections, results[0]

    def predict_batch(self, image_paths, conf_threshold=0.5, iou_threshold=0.45):
        """
        Run inference on multiple images.

        Args:
            image_paths: List of paths to input images
            conf_threshold: Confidence threshold for detections
            iou_threshold: IoU threshold for NMS

        Returns:
            List of detection lists, one per image
        """
        all_detections = []

        for img_path in image_paths:
            detections, _ = self.predict(img_path, conf_threshold, iou_threshold)
            all_detections.append(detections)

        return all_detections

    def evaluate(self, data_yaml):
        """
        Evaluate model on validation dataset.

        Args:
            data_yaml: Path to dataset YAML configuration file

        Returns:
            Evaluation metrics (mAP, precision, recall, etc.)
        """
        print("Evaluating YOLO model on validation set...")
        metrics = self.model.val(data=data_yaml, device=self.device)

        return {
            'mAP50': metrics.box.map50,
            'mAP50-95': metrics.box.map,
            'precision': metrics.box.mp,
            'recall': metrics.box.mr,
            'fitness': metrics.fitness
        }

    def get_model_info(self):
        """Get model information and architecture details."""
        return self.model.info()

    def export(self, format='onnx', output_path='models/yolov10_detector.onnx'):
        """
        Export model to different formats for deployment.

        Args:
            format: Export format ('onnx', 'torchscript', 'tensorflow', etc.)
            output_path: Path to save exported model
        """
        self.model.export(format=format, output=output_path)
        print(f"Model exported to {output_path}")


def create_yolo_data_yaml(data_dir, class_names, train_dir='train', val_dir='val'):
    """
    Create YAML configuration file for YOLO training.

    Args:
        data_dir: Root directory of dataset
        class_names: List of class names
        train_dir: Subdirectory name for training images
        val_dir: Subdirectory name for validation images

    Returns:
        Path to created YAML file
    """
    yaml_path = os.path.join(data_dir, 'dataset.yaml')

    config = {
        'path': str(Path(data_dir).absolute()),
        'train': train_dir,
        'val': val_dir,
        'nc': len(class_names),
        'names': class_names
    }

    with open(yaml_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)

    print(f"Created YOLO dataset configuration: {yaml_path}")
    return yaml_path
