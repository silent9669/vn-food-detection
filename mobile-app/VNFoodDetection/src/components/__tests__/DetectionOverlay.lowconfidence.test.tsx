import React from 'react';
import {render} from '@testing-library/react-native';
import fc from 'fast-check';
import DetectionOverlay from '../DetectionOverlay';
import {FoodDetection, BoundingBox} from '../../types/detection';

// **Feature: mobile-app, Property 14: Low confidence warning**
describe('DetectionOverlay - Property 14: Low confidence warning', () => {
  it('should apply warning color (orange) to detections with confidence < 0.5', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            dishName: fc.string({minLength: 1, maxLength: 30}),
            confidence: fc.double({min: 0, max: 0.49, noNaN: true}),
            boundingBox: fc.record({
              x: fc.double({min: 0, max: 0.7, noNaN: true}),
              y: fc.double({min: 0, max: 0.7, noNaN: true}),
              width: fc.double({min: 0.05, max: 0.3, noNaN: true}),
              height: fc.double({min: 0.05, max: 0.3, noNaN: true}),
            }),
            nutrition: fc.record({
              calories: fc.double({min: 0, max: 1000, noNaN: true}),
              protein: fc.double({min: 0, max: 100, noNaN: true}),
              carbohydrates: fc.double({min: 0, max: 200, noNaN: true}),
              fat: fc.double({min: 0, max: 100, noNaN: true}),
            }),
            count: fc.integer({min: 1, max: 5}),
          }),
          {minLength: 1, maxLength: 10},
        ),
        fc.integer({min: 300, max: 1000}),
        fc.integer({min: 300, max: 1000}),
        (detections: FoodDetection[], imageWidth: number, imageHeight: number) => {
          const {UNSAFE_getAllByType} = render(
            <DetectionOverlay
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              detections={detections}
            />,
          );

          // Get all TouchableOpacity components (bounding boxes)
          const touchables = UNSAFE_getAllByType(
            require('react-native').TouchableOpacity,
          );

          // Each bounding box should have orange border color (#FFA726)
          touchables.forEach(touchable => {
            const style = touchable.props.style;
            // Style can be an array or object
            const flatStyle = Array.isArray(style)
              ? Object.assign({}, ...style)
              : style;
            expect(flatStyle.borderColor).toBe('#FFA726');
          });
        },
      ),
      {numRuns: 100},
    );
  });

  it('should apply yellow color to detections with confidence between 0.5 and 0.7', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            dishName: fc.string({minLength: 1, maxLength: 30}),
            confidence: fc.double({min: 0.5, max: 0.69, noNaN: true}),
            boundingBox: fc.record({
              x: fc.double({min: 0, max: 0.7, noNaN: true}),
              y: fc.double({min: 0, max: 0.7, noNaN: true}),
              width: fc.double({min: 0.05, max: 0.3, noNaN: true}),
              height: fc.double({min: 0.05, max: 0.3, noNaN: true}),
            }),
            nutrition: fc.record({
              calories: fc.double({min: 0, max: 1000, noNaN: true}),
              protein: fc.double({min: 0, max: 100, noNaN: true}),
              carbohydrates: fc.double({min: 0, max: 200, noNaN: true}),
              fat: fc.double({min: 0, max: 100, noNaN: true}),
            }),
            count: fc.integer({min: 1, max: 5}),
          }),
          {minLength: 1, maxLength: 10},
        ),
        fc.integer({min: 300, max: 1000}),
        fc.integer({min: 300, max: 1000}),
        (detections: FoodDetection[], imageWidth: number, imageHeight: number) => {
          const {UNSAFE_getAllByType} = render(
            <DetectionOverlay
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              detections={detections}
            />,
          );

          const touchables = UNSAFE_getAllByType(
            require('react-native').TouchableOpacity,
          );

          // Each bounding box should have yellow border color (#FFEB3B)
          touchables.forEach(touchable => {
            const style = touchable.props.style;
            const flatStyle = Array.isArray(style)
              ? Object.assign({}, ...style)
              : style;
            expect(flatStyle.borderColor).toBe('#FFEB3B');
          });
        },
      ),
      {numRuns: 100},
    );
  });

  it('should apply green color to detections with confidence >= 0.7', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            dishName: fc.string({minLength: 1, maxLength: 30}),
            confidence: fc.double({min: 0.7, max: 1.0, noNaN: true}),
            boundingBox: fc.record({
              x: fc.double({min: 0, max: 0.7, noNaN: true}),
              y: fc.double({min: 0, max: 0.7, noNaN: true}),
              width: fc.double({min: 0.05, max: 0.3, noNaN: true}),
              height: fc.double({min: 0.05, max: 0.3, noNaN: true}),
            }),
            nutrition: fc.record({
              calories: fc.double({min: 0, max: 1000, noNaN: true}),
              protein: fc.double({min: 0, max: 100, noNaN: true}),
              carbohydrates: fc.double({min: 0, max: 200, noNaN: true}),
              fat: fc.double({min: 0, max: 100, noNaN: true}),
            }),
            count: fc.integer({min: 1, max: 5}),
          }),
          {minLength: 1, maxLength: 10},
        ),
        fc.integer({min: 300, max: 1000}),
        fc.integer({min: 300, max: 1000}),
        (detections: FoodDetection[], imageWidth: number, imageHeight: number) => {
          const {UNSAFE_getAllByType} = render(
            <DetectionOverlay
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              detections={detections}
            />,
          );

          const touchables = UNSAFE_getAllByType(
            require('react-native').TouchableOpacity,
          );

          // Each bounding box should have green border color (#4CAF50)
          touchables.forEach(touchable => {
            const style = touchable.props.style;
            const flatStyle = Array.isArray(style)
              ? Object.assign({}, ...style)
              : style;
            expect(flatStyle.borderColor).toBe('#4CAF50');
          });
        },
      ),
      {numRuns: 100},
    );
  });
});
