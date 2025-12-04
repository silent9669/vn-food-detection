import React from 'react';
import {render} from '@testing-library/react-native';
import fc from 'fast-check';
import LoadingIndicator from '../LoadingIndicator';

// **Feature: mobile-app, Property 22: Upload progress indication**
describe('LoadingIndicator - Property 22: Upload progress indication', () => {
  it('should display progress percentage when showProgress is true', () => {
    fc.assert(
      fc.property(
        fc.double({min: 0, max: 100, noNaN: true}),
        fc.string({minLength: 1, maxLength: 50}),
        (progress: number, message: string) => {
          const {getByText} = render(
            <LoadingIndicator
              message={message}
              progress={progress}
              showProgress={true}
            />,
          );

          // Message should be displayed
          expect(getByText(message)).toBeTruthy();

          // Progress percentage should be displayed
          const roundedProgress = Math.round(progress);
          expect(getByText(`${roundedProgress}%`)).toBeTruthy();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should not display progress when showProgress is false', () => {
    fc.assert(
      fc.property(
        fc.double({min: 0, max: 100, noNaN: true}),
        fc.string({minLength: 1, maxLength: 50}),
        (progress: number, message: string) => {
          const {queryByText} = render(
            <LoadingIndicator
              message={message}
              progress={progress}
              showProgress={false}
            />,
          );

          // Message should be displayed
          expect(queryByText(message)).toBeTruthy();

          // Progress percentage should NOT be displayed
          const roundedProgress = Math.round(progress);
          expect(queryByText(`${roundedProgress}%`)).toBeNull();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should display loading indicator for any message', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1, maxLength: 100}),
        (message: string) => {
          const {getByText, UNSAFE_getByType} = render(
            <LoadingIndicator message={message} />,
          );

          // Message should be displayed
          expect(getByText(message)).toBeTruthy();

          // ActivityIndicator should be present
          const ActivityIndicator = require('react-native').ActivityIndicator;
          const indicator = UNSAFE_getByType(ActivityIndicator);
          expect(indicator).toBeTruthy();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should handle progress values at boundaries (0 and 100)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 100),
        (progress: number) => {
          const {getByText} = render(
            <LoadingIndicator
              message="Testing"
              progress={progress}
              showProgress={true}
            />,
          );

          expect(getByText(`${progress}%`)).toBeTruthy();
        },
      ),
      {numRuns: 100},
    );
  });
});
