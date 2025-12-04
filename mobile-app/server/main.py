"""
Vietnamese Food Detection API Server
FastAPI backend for mobile app
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import base64
import io
from PIL import Image
import numpy as np
import logging
import torch
import torch.nn as nn
from torchvision import transforms, models
import pandas as pd
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Vietnamese Food Detection API",
    description="API for detecting Vietnamese food items using hybrid YOLOv10 + EfficientNet",
    version="1.0.0"
)

# Configure CORS to allow mobile app requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class NutritionInfo(BaseModel):
    calories: float
    protein: float
    carbohydrates: float
    fat: float

class FoodDetection(BaseModel):
    id: str
    dish_name: str
    confidence: float
    bounding_box: BoundingBox
    nutrition: Optional[NutritionInfo]
    count: int = 1

class DetectionResult(BaseModel):
    detections: List[FoodDetection]
    total_nutrition: NutritionInfo
    processing_time: float

class DetectionResponse(BaseModel):
    success: bool
    data: Optional[DetectionResult] = None
    error: Optional[str] = None
    message: Optional[str] = None

# Global variables for models (loaded on startup)
yolo_model = None
efficientnet_model = None
nutrition_data = None
class_names = None
device = None

def load_efficientnet_model(model_path: str, num_classes: int):
    """Load EfficientNet model from checkpoint"""
    try:
        # Initialize model architecture
        model = models.efficientnet_b4(pretrained=False)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
        
        # Load weights
        checkpoint = torch.load(model_path, map_location=device)
        model.load_state_dict(checkpoint)
        model.to(device)
        model.eval()
        
        logger.info(f"EfficientNet model loaded from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Error loading EfficientNet model: {e}")
        raise

def load_nutrition_data(csv_path: str) -> Dict[str, Dict[str, float]]:
    """Load nutrition data from CSV and create lookup dictionary"""
    try:
        df = pd.read_csv(csv_path)
        
        # Group by class_name and calculate average nutrition values
        nutrition_dict = {}
        for class_name in df['class_name'].unique():
            class_data = df[df['class_name'] == class_name]
            nutrition_dict[class_name] = {
                'calories': float(class_data['calories'].mean()),
                'protein': float(class_data['protein'].mean()),
                'carbohydrates': float(class_data['carbs'].mean()),
                'fat': float(class_data['fats'].mean())
            }
        
        logger.info(f"Loaded nutrition data for {len(nutrition_dict)} food classes")
        return nutrition_dict
    except Exception as e:
        logger.error(f"Error loading nutrition data: {e}")
        raise

def get_class_names(csv_path: str) -> List[str]:
    """Extract unique class names from CSV"""
    try:
        df = pd.read_csv(csv_path)
        classes = sorted(df['class_name'].unique().tolist())
        logger.info(f"Found {len(classes)} food classes")
        return classes
    except Exception as e:
        logger.error(f"Error extracting class names: {e}")
        raise

@app.on_event("startup")
async def load_models():
    """Load ML models on server startup"""
    global yolo_model, efficientnet_model, nutrition_data, class_names, device
    
    logger.info("Loading models...")
    
    try:
        # Set device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {device}")
        
        # Load class names and nutrition data
        csv_path = 'data_master/labels.csv'
        if Path(csv_path).exists():
            class_names = get_class_names(csv_path)
            nutrition_data = load_nutrition_data(csv_path)
        else:
            logger.warning(f"CSV file not found at {csv_path}")
        
        # Load EfficientNet model
        model_path = 'models/efficientnet_b4_classifier.pth'
        if Path(model_path).exists() and class_names:
            efficientnet_model = load_efficientnet_model(model_path, len(class_names))
        else:
            logger.warning(f"Model file not found at {model_path}")
        
        # YOLOv10 model not available yet
        logger.info("YOLOv10 model not available - using classification only")
        
        logger.info("Models loaded successfully")
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        # Continue without models (will return mock data)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Vietnamese Food Detection API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": yolo_model is not None and efficientnet_model is not None,
        "version": "1.0.0"
    }

def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode base64 string to PIL Image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        return image
    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image data")

def validate_image(image: Image.Image) -> bool:
    """Validate image format and size"""
    # Check format
    if image.format not in ['JPEG', 'PNG']:
        return False
    
    # Check size (max 10MB)
    if image.size[0] * image.size[1] > 10000000:
        return False
    
    return True

def preprocess_image(image: Image.Image) -> torch.Tensor:
    """Preprocess image for EfficientNet"""
    transform = transforms.Compose([
        transforms.Resize((380, 380)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    return transform(image).unsqueeze(0)

def classify_image(image: Image.Image) -> tuple:
    """Classify image using EfficientNet"""
    if efficientnet_model is None or class_names is None:
        return None, 0.0
    
    try:
        # Preprocess
        input_tensor = preprocess_image(image).to(device)
        
        # Inference
        with torch.no_grad():
            outputs = efficientnet_model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
        
        predicted_class = class_names[predicted_idx.item()]
        confidence_score = confidence.item()
        
        return predicted_class, confidence_score
    except Exception as e:
        logger.error(f"Error during classification: {e}")
        return None, 0.0

def create_detection_from_classification(
    predicted_class: str,
    confidence: float,
    image_width: int,
    image_height: int
) -> Optional[FoodDetection]:
    """Create a detection result from classification"""
    if predicted_class is None or nutrition_data is None:
        return None
    
    # Create bounding box covering most of the image
    bbox = BoundingBox(
        x=0.1,
        y=0.1,
        width=0.8,
        height=0.8
    )
    
    # Get nutrition info
    nutrition_info = nutrition_data.get(predicted_class)
    if nutrition_info:
        nutrition = NutritionInfo(
            calories=nutrition_info['calories'],
            protein=nutrition_info['protein'],
            carbohydrates=nutrition_info['carbohydrates'],
            fat=nutrition_info['fat']
        )
    else:
        nutrition = None
    
    detection = FoodDetection(
        id=f"det_{predicted_class}",
        dish_name=predicted_class,
        confidence=confidence,
        bounding_box=bbox,
        nutrition=nutrition,
        count=1
    )
    
    return detection

@app.post("/api/v1/detect", response_model=DetectionResponse)
async def detect_food(
    image: Optional[str] = Form(None),
    confidence_threshold: Optional[float] = Form(0.5),
    iou_threshold: Optional[float] = Form(0.45)
):
    """
    Detect Vietnamese food items in an image
    
    Args:
        image: Base64 encoded image string
        confidence_threshold: Minimum confidence score for detections
        iou_threshold: IoU threshold for NMS
    
    Returns:
        DetectionResponse with detection results
    """
    import time
    start_time = time.time()
    
    try:
        # Validate input
        if not image:
            return DetectionResponse(
                success=False,
                error="INVALID_IMAGE",
                message="No image provided"
            )
        
        # Decode image
        try:
            pil_image = decode_base64_image(image)
        except Exception as e:
            return DetectionResponse(
                success=False,
                error="INVALID_IMAGE",
                message=f"Failed to decode image: {str(e)}"
            )
        
        # Validate image
        if not validate_image(pil_image):
            return DetectionResponse(
                success=False,
                error="INVALID_IMAGE",
                message="Image format not supported or size too large"
            )
        
        # Check if model is loaded
        if efficientnet_model is None:
            return DetectionResponse(
                success=False,
                error="MODEL_NOT_LOADED",
                message="Detection model is not loaded. Please check server configuration."
            )
        
        # Run classification (simplified detection without YOLO)
        detections_list = []
        
        try:
            predicted_class, confidence = classify_image(pil_image)
            
            if predicted_class is None:
                return DetectionResponse(
                    success=False,
                    error="PROCESSING_ERROR",
                    message="Failed to classify image"
                )
            
            if confidence >= confidence_threshold:
                detection = create_detection_from_classification(
                    predicted_class,
                    confidence,
                    pil_image.width,
                    pil_image.height
                )
                if detection:
                    detections_list.append(detection)
        except Exception as e:
            logger.error(f"Error during classification: {e}")
            return DetectionResponse(
                success=False,
                error="PROCESSING_ERROR",
                message=f"Classification failed: {str(e)}"
            )
        
        # If no detection above threshold, return empty result
        if not detections_list:
            logger.info(f"No detections above threshold {confidence_threshold}")
            return DetectionResponse(
                success=True,
                data=DetectionResult(
                    detections=[],
                    total_nutrition=NutritionInfo(
                        calories=0,
                        protein=0,
                        carbohydrates=0,
                        fat=0
                    ),
                    processing_time=time.time() - start_time
                ),
                message="No food items detected with sufficient confidence"
            )
        
        # Calculate total nutrition
        total_nutrition = NutritionInfo(
            calories=sum(d.nutrition.calories * d.count for d in detections_list if d.nutrition),
            protein=sum(d.nutrition.protein * d.count for d in detections_list if d.nutrition),
            carbohydrates=sum(d.nutrition.carbohydrates * d.count for d in detections_list if d.nutrition),
            fat=sum(d.nutrition.fat * d.count for d in detections_list if d.nutrition)
        )
        
        processing_time = time.time() - start_time
        
        result = DetectionResult(
            detections=detections_list,
            total_nutrition=total_nutrition,
            processing_time=processing_time
        )
        
        return DetectionResponse(
            success=True,
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error during detection: {e}")
        return DetectionResponse(
            success=False,
            error="PROCESSING_ERROR",
            message=f"Error processing image: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
