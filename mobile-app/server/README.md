# Vietnamese Food Detection API Server

FastAPI backend server for the Vietnamese Food Detection mobile app.

## Features

- **POST /api/v1/detect**: Detect Vietnamese food items in images
- **GET /api/v1/health**: Health check endpoint
- **CORS enabled**: Allows requests from mobile app
- **Base64 image support**: Accepts base64 encoded images
- **Hybrid detection**: YOLOv10 for detection + EfficientNet for classification

## Setup

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Place trained models in the `models/` directory:
   - `models/yolov10_detector.pt` (YOLOv10 model)
   - `models/efficientnet_b4_classifier.pth` (EfficientNet model)

3. Place nutrition data:
   - `data_master/labels.csv` (Nutrition information)

### Running the Server

Development mode:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### POST /api/v1/detect

Detect food items in an image.

**Request:**
```json
{
  "image": "base64_encoded_image_string",
  "confidence_threshold": 0.5,
  "iou_threshold": 0.45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detections": [
      {
        "id": "det_001",
        "dish_name": "Phở tái",
        "confidence": 0.95,
        "bounding_box": {
          "x": 0.1,
          "y": 0.1,
          "width": 0.4,
          "height": 0.4
        },
        "nutrition": {
          "calories": 450,
          "protein": 25,
          "carbohydrates": 60,
          "fat": 12
        },
        "count": 1
      }
    ],
    "total_nutrition": {
      "calories": 450,
      "protein": 25,
      "carbohydrates": 60,
      "fat": 12
    },
    "processing_time": 1.23
  }
}
```

### GET /api/v1/health

Check server health status.

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "version": "1.0.0"
}
```

## Deployment

### VPS Deployment

1. Set up Ubuntu/Debian VPS
2. Install Python and dependencies
3. Clone repository
4. Install requirements
5. Copy models to server
6. Configure Nginx as reverse proxy
7. Set up SSL with Let's Encrypt
8. Run with Gunicorn + Uvicorn workers

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t vn-food-api .
docker run -p 8000:8000 vn-food-api
```

## Testing

Test the API:
```bash
curl -X POST http://localhost:8000/api/v1/detect \
  -F "image=@test_image.jpg" \
  -F "confidence_threshold=0.5"
```

Or use the mobile app to test end-to-end.

## Implementation Status

✅ **Completed:**
- FastAPI server with CORS
- Base64 image decoding and validation
- EfficientNet model loading and inference
- Nutrition data loading from CSV
- Classification-based detection
- Error handling and logging

⚠️ **Limitations:**
- YOLOv10 model not yet trained (using classification only)
- Single detection per image (no multi-object detection yet)
- Bounding box covers entire image

🔜 **TODO:**
- Train and integrate YOLOv10 for object detection
- Implement true hybrid pipeline (YOLO + EfficientNet)
- Add authentication if needed
- Add rate limiting for production
- Optimize inference speed

## Model Information

**EfficientNet B4 Classifier:**
- Input size: 380x380
- Trained on Vietnamese food dataset
- Returns top-1 prediction with confidence score

**Nutrition Data:**
- Loaded from `data_master/labels.csv`
- Average values per food class
- Includes: calories, protein, carbohydrates, fat
