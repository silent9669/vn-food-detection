// Core detection types

export interface DetectionResult {
  detections: FoodDetection[];
  totalNutrition: NutritionInfo;
  processingTime: number;
}

export interface FoodDetection {
  id: string;
  dishName: string;
  confidence: number;
  boundingBox: BoundingBox;
  nutrition: NutritionInfo;
  count: number;
}

export interface BoundingBox {
  x: number; // pixels from left
  y: number; // pixels from top
  width: number; // box width in pixels
  height: number; // box height in pixels
}

export interface NutritionInfo {
  calories: number; // kcal
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
}
