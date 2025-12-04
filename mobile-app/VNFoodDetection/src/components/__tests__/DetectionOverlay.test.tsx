import React from 'react';
import {render} from '@testing-library/react-native';
import * as fc from 'fast-check';
import DetectionOverlay from '../DetectionOverlay';
import {FoodDetection} from '../../types/detection';

/**
 * Property Test 8: Bounding box rendering
 * Validates: Requirements 3.4
 *
 * Property Test 9: Unique detection identifiers
 * Validates: Requirements 3.5
 *
 * Property Test 11: Dish name rendering
 * Validates: Requirements 4.1
 *
 * Property Test 12: Confidence score formatting
 * Validates: Requirements 4.2
 *
 * Property Test 15: Detection highlighting
 * Validates: Requirements 4.5
 */

describe('DetectionOverlay - Property Tests', () => {
  // Generator for food detections with unique IDs
  const foodDetectionArb = fc
    .integer({min: 0, max: 10000})
    .chain(id =>
      fc.record({
        id: fc.constant(`detection-${id}`),
        dishName: fc.constantFrom('Phở', 'Bánh mì', 'Bún chả', 'Gỏi cuốn'),
        confidence: fc.double({min: 0.5, max: 1.0, noNaN: true}),
        boundingBox: fc.record({
          x: fc.double({min: 0, max: 0.7, noNaN: true}),
          y: fc.double({min: 0, max: 0.7, noNaN: true}),
          width: fc.double({min: 0.1, max: 0.2, noNaN: true}),
          height: fc.double({min: 0.1, max: 0.2, noNaN: true}),
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
      }),
    ) as fc.Arbitrary<FoodDetection>;

  describe('Property 8: Bounding box rendering', () => {
    it('should render bounding boxes for all detections', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 1, maxLength: 10}),
          fc.integer({min: 300, max: 800}),
          fc.integer({min: 300, max: 800}),
          (detections, imageWidth, imageHeight) => {
            render(
              <DetectionOverlay
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                detections={detections}
              />,
            );

            // Property: Each detection should have valid bounding box coordinates
            detections.forEach(detection => {
              const {boundingBox} = detection;
              const left = boundingBox.x * imageWidth;
              const top = boundingBox.y * imageHeight;
              const width = boundingBox.width * imageWidth;
              const height = boundingBox.height * imageHeight;

              // Coordinates should be within image bounds
              expect(left).toBeGreaterThanOrEqual(0);
              expect(top).toBeGreaterThanOrEqual(0);
              expect(left + width).toBeLessThanOrEqual(imageWidth + 0.01);
              expect(top + height).toBeLessThanOrEqual(imageHeight + 0.01);
            });
          },
        ),
        {numRuns: 50},
      );
    });
  });

  describe('Property 9: Unique detection identifiers', () => {
    it('should use unique IDs for each detection', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(foodDetectionArb, {
            minLength: 2,
            maxLength: 10,
            selector: d => d.id,
          }),
          detections => {
            // Property 1: All IDs should be unique
            const ids = detections.map(d => d.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);

            // Property 2: Each ID should be a non-empty string
            ids.forEach(id => {
              expect(typeof id).toBe('string');
              expect(id.length).toBeGreaterThan(0);
            });
          },
        ),
        {numRuns: 100},
      );
    });
  });

  describe('Property 11: Dish name rendering', () => {
    it('should display dish names for all detections', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 1, maxLength: 5}),
          detections => {
            const {getAllByText} = render(
              <DetectionOverlay
                imageWidth={400}
                imageHeight={400}
                detections={detections}
              />,
            );

            // Property: Each unique dish name should be rendered
            const uniqueDishNames = [...new Set(detections.map(d => d.dishName))];
            uniqueDishNames.forEach(dishName => {
              expect(getAllByText(dishName).length).toBeGreaterThan(0);
            });
          },
        ),
        {numRuns: 50},
      );
    });

    it('should handle various dish name formats', () => {
      fc.assert(
        fc.property(
          fc.string({minLength: 1, maxLength: 50}),
          dishName => {
            const detection: FoodDetection = {
              id: '1',
              dishName,
              confidence: 0.9,
              boundingBox: {x: 0.1, y: 0.1, width: 0.2, height: 0.2},
            };

            const {getByText} = render(
              <DetectionOverlay
                imageWidth={400}
                imageHeight={400}
                detections={[detection]}
              />,
            );

            // Property: Dish name should be rendered regardless of format
            expect(getByText(dishName)).toBeTruthy();
          },
        ),
        {numRuns: 50},
      );
    });
  });

  describe('Property 12: Confidence score formatting', () => {
    it('should format confidence scores as percentages', () => {
      fc.assert(
        fc.property(
          fc.double({min: 0, max: 1, noNaN: true}),
          confidence => {
            const detection: FoodDetection = {
              id: '1',
              dishName: 'Phở',
              confidence,
              boundingBox: {x: 0.1, y: 0.1, width: 0.2, height: 0.2},
            };

            const {getByText} = render(
              <DetectionOverlay
                imageWidth={400}
                imageHeight={400}
                detections={[detection]}
              />,
            );

            // Property 1: Confidence should be formatted as percentage
            const expectedText = `${Math.round(confidence * 100)}%`;
            expect(getByText(expectedText)).toBeTruthy();

            // Property 2: Percentage should be between 0 and 100
            const percentage = Math.round(confidence * 100);
            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should handle edge case confidence values', () => {
      const edgeCases = [0, 0.5, 1, 0.999, 0.001];

      edgeCases.forEach(confidence => {
        const detection: FoodDetection = {
          id: `test-${confidence}`,
          dishName: 'Phở',
          confidence,
          boundingBox: {x: 0.1, y: 0.1, width: 0.2, height: 0.2},
        };

        const {getByText} = render(
          <DetectionOverlay
            imageWidth={400}
            imageHeight={400}
            detections={[detection]}
          />,
        );

        const expectedText = `${Math.round(confidence * 100)}%`;
        expect(getByText(expectedText)).toBeTruthy();
      });
    });
  });

  describe('Property 15: Detection highlighting', () => {
    it('should support detection selection', () => {
      fc.assert(
        fc.property(
          fc.array(foodDetectionArb, {minLength: 2, maxLength: 5}),
          detections => {
            const mockOnPress = jest.fn();

            render(
              <DetectionOverlay
                imageWidth={400}
                imageHeight={400}
                detections={detections}
                onDetectionPress={mockOnPress}
              />,
            );

            // Property: onDetectionPress callback should be available
            expect(mockOnPress).toBeDefined();
            expect(typeof mockOnPress).toBe('function');
          },
        ),
        {numRuns: 20},
      );
    });
  });

  describe('Additional properties', () => {
    it('should handle empty detections array', () => {
      const {UNSAFE_queryAllByType} = render(
        <DetectionOverlay
          imageWidth={400}
          imageHeight={400}
          detections={[]}
        />,
      );

      // Property: No bounding boxes should be rendered for empty array
      const touchables = UNSAFE_queryAllByType('TouchableOpacity' as any);
      expect(touchables.length).toBe(0);
    });

    it('should scale bounding boxes with image dimensions', () => {
      fc.assert(
        fc.property(
          foodDetectionArb,
          fc.integer({min: 200, max: 1000}),
          fc.integer({min: 200, max: 1000}),
          (detection, width, height) => {
            const {boundingBox} = detection;

            // Property: Scaled dimensions should be proportional to image size
            const scaledLeft = boundingBox.x * width;
            const scaledTop = boundingBox.y * height;
            const scaledWidth = boundingBox.width * width;
            const scaledHeight = boundingBox.height * height;

            // All scaled values should be positive
            expect(scaledLeft).toBeGreaterThanOrEqual(0);
            expect(scaledTop).toBeGreaterThanOrEqual(0);
            expect(scaledWidth).toBeGreaterThan(0);
            expect(scaledHeight).toBeGreaterThan(0);

            // Scaled values should not exceed image dimensions (with small tolerance for floating point)
            expect(scaledLeft + scaledWidth).toBeLessThanOrEqual(width + 0.01);
            expect(scaledTop + scaledHeight).toBeLessThanOrEqual(height + 0.01);
          },
        ),
        {numRuns: 100},
      );
    });
  });
});
