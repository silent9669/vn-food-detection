import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import fc from 'fast-check';
import NutritionCard from '../NutritionCard';
import {NutritionInfo} from '../../types/detection';
import {ItemNutrition} from '../../utils/nutritionCalculator';

// **Feature: mobile-app, Property 16: Nutrition data display**
describe('NutritionCard - Property 16: Nutrition data display', () => {
  it('should display all four nutrition values for any valid nutrition data', () => {
    fc.assert(
      fc.property(
        fc.record({
          calories: fc.double({min: 0, max: 2000, noNaN: true}),
          protein: fc.double({min: 0, max: 200, noNaN: true}),
          carbohydrates: fc.double({min: 0, max: 300, noNaN: true}),
          fat: fc.double({min: 0, max: 150, noNaN: true}),
        }),
        (nutrition: NutritionInfo) => {
          const {getByText, getAllByText} = render(
            <NutritionCard totalNutrition={nutrition} items={[]} />,
          );

          // Check that all four nutrient labels are present
          expect(getByText('Calories')).toBeTruthy();
          expect(getByText('Protein')).toBeTruthy();
          expect(getByText('Carbohydrates')).toBeTruthy();
          expect(getByText('Fat')).toBeTruthy();

          // Check that values are displayed (rounded)
          const roundedCalories = Math.round(nutrition.calories);
          const roundedProtein = Math.round(nutrition.protein);
          const roundedCarbs = Math.round(nutrition.carbohydrates);
          const roundedFat = Math.round(nutrition.fat);

          // Calories has unique format with " kcal"
          expect(getByText(`${roundedCalories} kcal`)).toBeTruthy();
          
          // For gram values, use getAllByText since values might be duplicated (e.g., all 0g)
          const proteinText = `${roundedProtein}g`;
          const carbsText = `${roundedCarbs}g`;
          const fatText = `${roundedFat}g`;
          
          // Just verify that the text exists somewhere in the component
          const allTexts = [proteinText, carbsText, fatText];
          allTexts.forEach(text => {
            const elements = getAllByText(text);
            expect(elements.length).toBeGreaterThan(0);
          });
        },
      ),
      {numRuns: 100},
    );
  });
});

// **Feature: mobile-app, Property 19: Nutrition detail toggle**
describe('NutritionCard - Property 19: Nutrition detail toggle', () => {
  it('should toggle detailed breakdown visibility when button is pressed', () => {
    fc.assert(
      fc.property(
        fc.record({
          calories: fc.double({min: 0, max: 2000, noNaN: true}),
          protein: fc.double({min: 0, max: 200, noNaN: true}),
          carbohydrates: fc.double({min: 0, max: 300, noNaN: true}),
          fat: fc.double({min: 0, max: 150, noNaN: true}),
        }),
        fc.array(
          fc.record({
            dishName: fc.string({minLength: 1, maxLength: 30}),
            count: fc.integer({min: 1, max: 5}),
            calories: fc.double({min: 0, max: 1000, noNaN: true}),
            protein: fc.double({min: 0, max: 100, noNaN: true}),
            carbohydrates: fc.double({min: 0, max: 150, noNaN: true}),
            fat: fc.double({min: 0, max: 75, noNaN: true}),
          }),
          {minLength: 1, maxLength: 5},
        ),
        (totalNutrition: NutritionInfo, items: ItemNutrition[]) => {
          const {getByText, queryByText} = render(
            <NutritionCard totalNutrition={totalNutrition} items={items} />,
          );

          // Initially, details should be hidden
          expect(queryByText('Detailed Breakdown')).toBeNull();
          expect(getByText('Show Details')).toBeTruthy();

          // Press toggle button to show details
          const toggleButton = getByText('Show Details');
          fireEvent.press(toggleButton);

          // Details should now be visible
          expect(getByText('Detailed Breakdown')).toBeTruthy();
          expect(getByText('Hide Details')).toBeTruthy();

          // Press toggle button again to hide details
          const hideButton = getByText('Hide Details');
          fireEvent.press(hideButton);

          // Details should be hidden again
          expect(queryByText('Detailed Breakdown')).toBeNull();
          expect(getByText('Show Details')).toBeTruthy();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should not show toggle button when items array is empty', () => {
    fc.assert(
      fc.property(
        fc.record({
          calories: fc.double({min: 0, max: 2000, noNaN: true}),
          protein: fc.double({min: 0, max: 200, noNaN: true}),
          carbohydrates: fc.double({min: 0, max: 300, noNaN: true}),
          fat: fc.double({min: 0, max: 150, noNaN: true}),
        }),
        (totalNutrition: NutritionInfo) => {
          const {queryByText} = render(
            <NutritionCard totalNutrition={totalNutrition} items={[]} />,
          );

          // Toggle button should not be present when no items
          expect(queryByText('Show Details')).toBeNull();
          expect(queryByText('Hide Details')).toBeNull();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should display all item details when details are shown', () => {
    fc.assert(
      fc.property(
        fc.record({
          calories: fc.double({min: 0, max: 2000, noNaN: true}),
          protein: fc.double({min: 0, max: 200, noNaN: true}),
          carbohydrates: fc.double({min: 0, max: 300, noNaN: true}),
          fat: fc.double({min: 0, max: 150, noNaN: true}),
        }),
        fc.array(
          fc.record({
            dishName: fc.string({minLength: 1, maxLength: 30}),
            count: fc.integer({min: 1, max: 5}),
            calories: fc.double({min: 0, max: 1000, noNaN: true}),
            protein: fc.double({min: 0, max: 100, noNaN: true}),
            carbohydrates: fc.double({min: 0, max: 150, noNaN: true}),
            fat: fc.double({min: 0, max: 75, noNaN: true}),
          }),
          {minLength: 1, maxLength: 5},
        ),
        (totalNutrition: NutritionInfo, items: ItemNutrition[]) => {
          const {getByText} = render(
            <NutritionCard
              totalNutrition={totalNutrition}
              items={items}
              showDetailsInitially={true}
            />,
          );

          // All item names should be visible
          items.forEach(item => {
            const displayName =
              item.count > 1 ? `${item.dishName} (x${item.count})` : item.dishName;
            expect(getByText(displayName)).toBeTruthy();
          });
        },
      ),
      {numRuns: 100},
    );
  });
});
