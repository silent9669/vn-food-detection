import {FoodDetection} from '../types/detection';

export interface AggregatedDetection {
  dishName: string;
  count: number;
  detections: FoodDetection[];
  totalConfidence: number;
  averageConfidence: number;
}

/**
 * Aggregate detections by dish name and count occurrences
 */
export function aggregateDetections(
  detections: FoodDetection[],
): AggregatedDetection[] {
  // Group detections by dish name
  const grouped = detections.reduce((acc, detection) => {
    const key = detection.dishName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(detection);
    return acc;
  }, {} as Record<string, FoodDetection[]>);

  // Convert to aggregated format
  const aggregated: AggregatedDetection[] = Object.entries(grouped).map(
    ([dishName, detectionList]) => {
      const totalConfidence = detectionList.reduce(
        (sum, d) => sum + d.confidence,
        0,
      );
      const averageConfidence = totalConfidence / detectionList.length;

      return {
        dishName,
        count: detectionList.length,
        detections: detectionList,
        totalConfidence,
        averageConfidence,
      };
    },
  );

  // Sort by count (descending) then by average confidence (descending)
  return aggregated.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return b.averageConfidence - a.averageConfidence;
  });
}

/**
 * Format dish name with count for display
 */
export function formatDishNameWithCount(
  dishName: string,
  count: number,
): string {
  if (count === 1) {
    return dishName;
  }
  return `${dishName} (x${count})`;
}

/**
 * Get unique dish names from detections
 */
export function getUniqueDishNames(detections: FoodDetection[]): string[] {
  const uniqueNames = new Set(detections.map(d => d.dishName));
  return Array.from(uniqueNames);
}

/**
 * Count total detections
 */
export function getTotalDetectionCount(detections: FoodDetection[]): number {
  return detections.length;
}

/**
 * Get detections by dish name
 */
export function getDetectionsByDishName(
  detections: FoodDetection[],
  dishName: string,
): FoodDetection[] {
  return detections.filter(d => d.dishName === dishName);
}
