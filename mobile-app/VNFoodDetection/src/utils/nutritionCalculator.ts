import {NutritionInfo, FoodDetection} from '../types/detection';
import {AggregatedDetection} from './detectionUtils';

export interface ItemNutrition extends NutritionInfo {
  dishName: string;
  count: number;
}

/**
 * Calculate nutrition for a single item multiplied by count
 */
export function calculateItemNutrition(
  nutrition: NutritionInfo,
  count: number,
): NutritionInfo {
  return {
    calories: nutrition.calories * count,
    protein: nutrition.protein * count,
    carbohydrates: nutrition.carbohydrates * count,
    fat: nutrition.fat * count,
  };
}

/**
 * Calculate total nutrition from multiple items
 */
export function calculateTotalNutrition(
  items: ItemNutrition[],
): NutritionInfo {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbohydrates: total.carbohydrates + item.carbohydrates,
      fat: total.fat + item.fat,
    }),
    {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
    },
  );
}

/**
 * Calculate nutrition from aggregated detections
 */
export function calculateNutritionFromAggregated(
  aggregated: AggregatedDetection[],
): {items: ItemNutrition[]; total: NutritionInfo} {
  const items: ItemNutrition[] = [];

  for (const agg of aggregated) {
    // Get nutrition from first detection (they should all be the same dish)
    const firstDetection = agg.detections[0];
    if (firstDetection.nutrition) {
      const itemNutrition = calculateItemNutrition(
        firstDetection.nutrition,
        agg.count,
      );
      items.push({
        ...itemNutrition,
        dishName: agg.dishName,
        count: agg.count,
      });
    }
  }

  const total = calculateTotalNutrition(items);

  return {items, total};
}

/**
 * Calculate nutrition from detections
 */
export function calculateNutritionFromDetections(
  detections: FoodDetection[],
): {items: ItemNutrition[]; total: NutritionInfo} {
  const items: ItemNutrition[] = [];

  for (const detection of detections) {
    if (detection.nutrition) {
      items.push({
        ...detection.nutrition,
        dishName: detection.dishName,
        count: 1,
      });
    }
  }

  const total = calculateTotalNutrition(items);

  return {items, total};
}

/**
 * Format nutrition value for display
 */
export function formatNutritionValue(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}

/**
 * Check if nutrition data is available
 */
export function hasNutritionData(detection: FoodDetection): boolean {
  return detection.nutrition !== undefined && detection.nutrition !== null;
}

/**
 * Get missing nutrition count
 */
export function getMissingNutritionCount(detections: FoodDetection[]): number {
  return detections.filter(d => !hasNutritionData(d)).length;
}
