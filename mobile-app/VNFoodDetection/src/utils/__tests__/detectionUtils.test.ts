import * as fc from 'fast-check';
import {
  aggregateDetections,
  formatDishNameWithCount,
  getUniqueDishNames,
  getTotalDetectionCount,
  getDetectionsByDishName,
} from '../detectionUtils';
import {FoodDetection} from '../../types/detection';

/**
 * Property Test 13: Duplicate dish counting
 * Validates: Requirements 4.3
 *
 * Property: When multiple instances of the same dish are detected,
 * they should be counted and aggregated correctly.
 */

describe('detectionUtils - Property Tests', () => {
  describe('Property 13: Duplicate dish counting', () => {
    // Generator for food detections
    const foodDetectionArb = fc.record({
      id: fc.string({minLength: 1, maxLength: 20}),
      dishName: fc.constantFrom('Phở', 'Bánh mì', 'Bún chả', 'Gỏi cuốn', 'Cơm tấm'),
      confidence: fc.double({min: 0.5, max: 1.0, noNaN: true}),
      boundingBox: fc.record({
        x: fc.double({min: 0, max: 1, noNaN: true}),
        y: fc.double({min: 0, max: 1, noNaN: true}),
        width: fc.double({min: 0.1, max: 0.5, noNaN: true}),
        height: fc.double({min: 0.1, max: 0.5, noNaN: true}),
      }),
      nutrition: fc.option(
        fc.record({
          calories: fc.integer({min: 100, max: 1000}),
          protein: fc.double({min: 5, max: 50, noNaN: true}),
          carbohydrates: fc.double({min: 10, max: 100, noNaN: true}),
          fat: fc.double({min: 5, max: 50, noNaN: true}),
        }),
        {nil: undefined},
      ),
    }) as fc.Arbitrary<FoodDetection>;

    it('should count duplicate dishes correctly', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 1, maxLength: 20}),
          detections => {
            const aggregated = aggregateDetections(detections);

            // Property 1: Total count should equal original detections length
            const totalCount = aggregated.reduce((sum, agg) => sum + agg.count, 0);
            expect(totalCount).toBe(detections.length);

            // Property 2: Each aggregated item should have at least 1 detection
            aggregated.forEach(agg => {
              expect(agg.count).toBeGreaterThanOrEqual(1);
              expect(agg.detections.length).toBe(agg.count);
            });

            // Property 3: All detections in an aggregated group should have the same dish name
            aggregated.forEach(agg => {
              agg.detections.forEach(detection => {
                expect(detection.dishName).toBe(agg.dishName);
              });
            });

            // Property 4: Average confidence should be within valid range
            aggregated.forEach(agg => {
              expect(agg.averageConfidence).toBeGreaterThanOrEqual(0);
              expect(agg.averageConfidence).toBeLessThanOrEqual(1);
            });
          },
        ),
        {numRuns: 100},
      );
    });

    it('should format dish names with counts correctly', () => {
      fc.assert(
        fc.property(
          fc.string({minLength: 1, maxLength: 50}),
          fc.integer({min: 1, max: 10}),
          (dishName, count) => {
            const formatted = formatDishNameWithCount(dishName, count);

            // Property 1: Formatted string should contain the dish name
            expect(formatted).toContain(dishName);

            // Property 2: If count is 1, no count indicator should be present
            if (count === 1) {
              expect(formatted).toBe(dishName);
            }

            // Property 3: If count > 1, count indicator should be present
            if (count > 1) {
              expect(formatted).toContain(`(x${count})`);
            }
          },
        ),
        {numRuns: 50},
      );
    });

    it('should extract unique dish names correctly', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 1, maxLength: 20}),
          detections => {
            const uniqueNames = getUniqueDishNames(detections);

            // Property 1: All unique names should be present in original detections
            uniqueNames.forEach(name => {
              const found = detections.some(d => d.dishName === name);
              expect(found).toBe(true);
            });

            // Property 2: No duplicates in unique names
            const uniqueSet = new Set(uniqueNames);
            expect(uniqueSet.size).toBe(uniqueNames.length);

            // Property 3: Unique names count should be <= total detections
            expect(uniqueNames.length).toBeLessThanOrEqual(detections.length);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should count total detections correctly', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 0, maxLength: 50}),
          detections => {
            const count = getTotalDetectionCount(detections);

            // Property 1: Count should equal array length
            expect(count).toBe(detections.length);

            // Property 2: Count should be non-negative
            expect(count).toBeGreaterThanOrEqual(0);
          },
        ),
        {numRuns: 50},
      );
    });

    it('should filter detections by dish name correctly', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 1, maxLength: 20}),
          fc.constantFrom('Phở', 'Bánh mì', 'Bún chả', 'Gỏi cuốn', 'Cơm tấm'),
          (detections, targetDishName) => {
            const filtered = getDetectionsByDishName(detections, targetDishName);

            // Property 1: All filtered items should have the target dish name
            filtered.forEach(detection => {
              expect(detection.dishName).toBe(targetDishName);
            });

            // Property 2: Filtered count should be <= total detections
            expect(filtered.length).toBeLessThanOrEqual(detections.length);

            // Property 3: Filtered count should match manual count
            const manualCount = detections.filter(
              d => d.dishName === targetDishName,
            ).length;
            expect(filtered.length).toBe(manualCount);
          },
        ),
        {numRuns: 100},
      );
    });
  });
});
