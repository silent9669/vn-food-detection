import * as fc from 'fast-check';
import {
  calculateItemNutrition,
  calculateTotalNutrition,
  calculateNutritionFromDetections,
  formatNutritionValue,
  hasNutritionData,
  getMissingNutritionCount,
  ItemNutrition,
} from '../nutritionCalculator';
import {NutritionInfo, FoodDetection} from '../../types/detection';

/**
 * Property Test 17: Serving count multiplication
 * Validates: Requirements 5.2
 *
 * Property: Nutrition values should be correctly multiplied by serving count.
 */

/**
 * Property Test 18: Total nutrition summation
 * Validates: Requirements 5.3
 *
 * Property: Total nutrition should be the sum of all individual item nutritions.
 */

describe('nutritionCalculator - Property Tests', () => {
  // Generator for nutrition info
  const nutritionArb = fc.record({
    calories: fc.integer({min: 50, max: 1000}),
    protein: fc.double({min: 1, max: 50, noNaN: true}),
    carbohydrates: fc.double({min: 5, max: 100, noNaN: true}),
    fat: fc.double({min: 1, max: 50, noNaN: true}),
  }) as fc.Arbitrary<NutritionInfo>;

  // Generator for food detections
  const foodDetectionArb = fc.record({
    id: fc.string({minLength: 1, maxLength: 20}),
    dishName: fc.constantFrom('Phở', 'Bánh mì', 'Bún chả'),
    confidence: fc.double({min: 0.5, max: 1.0, noNaN: true}),
    boundingBox: fc.record({
      x: fc.double({min: 0, max: 1, noNaN: true}),
      y: fc.double({min: 0, max: 1, noNaN: true}),
      width: fc.double({min: 0.1, max: 0.5, noNaN: true}),
      height: fc.double({min: 0.1, max: 0.5, noNaN: true}),
    }),
    nutrition: fc.option(nutritionArb, {nil: undefined}),
  }) as fc.Arbitrary<FoodDetection>;

  describe('Property 17: Serving count multiplication', () => {
    it('should multiply nutrition values by count correctly', () => {
      fc.assert(
        fc.property(
          nutritionArb,
          fc.integer({min: 1, max: 10}),
          (nutrition, count) => {
            const result = calculateItemNutrition(nutrition, count);

            // Property 1: Each value should be multiplied by count
            expect(result.calories).toBe(nutrition.calories * count);
            expect(result.protein).toBe(nutrition.protein * count);
            expect(result.carbohydrates).toBe(nutrition.carbohydrates * count);
            expect(result.fat).toBe(nutrition.fat * count);

            // Property 2: Multiplying by 1 should return same values
            if (count === 1) {
              expect(result.calories).toBe(nutrition.calories);
              expect(result.protein).toBe(nutrition.protein);
              expect(result.carbohydrates).toBe(nutrition.carbohydrates);
              expect(result.fat).toBe(nutrition.fat);
            }

            // Property 3: All values should be non-negative
            expect(result.calories).toBeGreaterThanOrEqual(0);
            expect(result.protein).toBeGreaterThanOrEqual(0);
            expect(result.carbohydrates).toBeGreaterThanOrEqual(0);
            expect(result.fat).toBeGreaterThanOrEqual(0);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should handle zero count correctly', () => {
      fc.assert(
        fc.property(nutritionArb, nutrition => {
          const result = calculateItemNutrition(nutrition, 0);

          // Property: Multiplying by 0 should return all zeros
          expect(result.calories).toBe(0);
          expect(result.protein).toBe(0);
          expect(result.carbohydrates).toBe(0);
          expect(result.fat).toBe(0);
        }),
        {numRuns: 50},
      );
    });
  });

  describe('Property 18: Total nutrition summation', () => {
    it('should sum nutrition values correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              calories: fc.integer({min: 50, max: 1000}),
              protein: fc.double({min: 1, max: 50, noNaN: true}),
              carbohydrates: fc.double({min: 5, max: 100, noNaN: true}),
              fat: fc.double({min: 1, max: 50, noNaN: true}),
              dishName: fc.constantFrom('Phở', 'Bánh mì', 'Bún chả'),
              count: fc.integer({min: 1, max: 5}),
            }) as fc.Arbitrary<ItemNutrition>,
            {minLength: 1, maxLength: 10},
          ),
          items => {
            const total = calculateTotalNutrition(items);

            // Property 1: Total should equal sum of all items
            const expectedCalories = items.reduce((sum, item) => sum + item.calories, 0);
            const expectedProtein = items.reduce((sum, item) => sum + item.protein, 0);
            const expectedCarbs = items.reduce(
              (sum, item) => sum + item.carbohydrates,
              0,
            );
            const expectedFat = items.reduce((sum, item) => sum + item.fat, 0);

            expect(total.calories).toBeCloseTo(expectedCalories, 5);
            expect(total.protein).toBeCloseTo(expectedProtein, 5);
            expect(total.carbohydrates).toBeCloseTo(expectedCarbs, 5);
            expect(total.fat).toBeCloseTo(expectedFat, 5);

            // Property 2: Total should be non-negative
            expect(total.calories).toBeGreaterThanOrEqual(0);
            expect(total.protein).toBeGreaterThanOrEqual(0);
            expect(total.carbohydrates).toBeGreaterThanOrEqual(0);
            expect(total.fat).toBeGreaterThanOrEqual(0);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should handle empty array correctly', () => {
      const total = calculateTotalNutrition([]);

      // Property: Empty array should return all zeros
      expect(total.calories).toBe(0);
      expect(total.protein).toBe(0);
      expect(total.carbohydrates).toBe(0);
      expect(total.fat).toBe(0);
    });

    it('should handle single item correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            calories: fc.integer({min: 50, max: 1000}),
            protein: fc.double({min: 1, max: 50, noNaN: true}),
            carbohydrates: fc.double({min: 5, max: 100, noNaN: true}),
            fat: fc.double({min: 1, max: 50, noNaN: true}),
            dishName: fc.constantFrom('Phở', 'Bánh mì'),
            count: fc.integer({min: 1, max: 5}),
          }) as fc.Arbitrary<ItemNutrition>,
          item => {
            const total = calculateTotalNutrition([item]);

            // Property: Single item total should equal the item itself
            expect(total.calories).toBe(item.calories);
            expect(total.protein).toBe(item.protein);
            expect(total.carbohydrates).toBe(item.carbohydrates);
            expect(total.fat).toBe(item.fat);
          },
        ),
        {numRuns: 50},
      );
    });
  });

  describe('Additional nutrition utilities', () => {
    it('should calculate nutrition from detections correctly', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 1, maxLength: 10}),
          detections => {
            const {items, total} = calculateNutritionFromDetections(detections);

            // Property 1: Items count should match detections with nutrition
            const detectionsWithNutrition = detections.filter(d => d.nutrition);
            expect(items.length).toBe(detectionsWithNutrition.length);

            // Property 2: Total should be sum of items
            const manualTotal = items.reduce(
              (sum, item) => ({
                calories: sum.calories + item.calories,
                protein: sum.protein + item.protein,
                carbohydrates: sum.carbohydrates + item.carbohydrates,
                fat: sum.fat + item.fat,
              }),
              {calories: 0, protein: 0, carbohydrates: 0, fat: 0},
            );

            expect(total.calories).toBeCloseTo(manualTotal.calories, 5);
            expect(total.protein).toBeCloseTo(manualTotal.protein, 5);
            expect(total.carbohydrates).toBeCloseTo(manualTotal.carbohydrates, 5);
            expect(total.fat).toBeCloseTo(manualTotal.fat, 5);
          },
        ),
        {numRuns: 50},
      );
    });

    it('should format nutrition values correctly', () => {
      fc.assert(
        fc.property(
          fc.double({min: 0, max: 1000, noNaN: true}),
          fc.constantFrom('g', 'kcal', 'mg'),
          (value, unit) => {
            const formatted = formatNutritionValue(value, unit);

            // Property 1: Formatted string should contain the unit
            expect(formatted).toContain(unit);

            // Property 2: Formatted string should contain a number
            expect(formatted).toMatch(/\d+/);

            // Property 3: Value should be rounded
            const roundedValue = Math.round(value);
            expect(formatted).toContain(roundedValue.toString());
          },
        ),
        {numRuns: 50},
      );
    });

    it('should detect missing nutrition data correctly', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 1, maxLength: 20}),
          detections => {
            const missingCount = getMissingNutritionCount(detections);

            // Property 1: Missing count should be non-negative
            expect(missingCount).toBeGreaterThanOrEqual(0);

            // Property 2: Missing count should not exceed total detections
            expect(missingCount).toBeLessThanOrEqual(detections.length);

            // Property 3: Missing count should match manual count
            const manualCount = detections.filter(d => !hasNutritionData(d)).length;
            expect(missingCount).toBe(manualCount);
          },
        ),
        {numRuns: 100},
      );
    });
  });
});
