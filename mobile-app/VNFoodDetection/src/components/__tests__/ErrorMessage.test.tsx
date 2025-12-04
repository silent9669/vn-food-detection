import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import fc from 'fast-check';
import ErrorMessage, {ErrorType} from '../ErrorMessage';

// **Feature: mobile-app, Property 21: Error logging**
describe('ErrorMessage - Property 21: Error logging', () => {
  it('should display error message for any error type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ErrorType>(
          'NETWORK_ERROR',
          'TIMEOUT_ERROR',
          'INVALID_IMAGE',
          'PROCESSING_ERROR',
          'NO_DETECTIONS',
          'UNKNOWN_ERROR',
        ),
        fc.string({minLength: 1, maxLength: 200}),
        (errorType: ErrorType, errorMessage: string) => {
          const {getByText} = render(
            <ErrorMessage
              errorType={errorType}
              errorMessage={errorMessage}
            />,
          );

          // Error message should be displayed
          expect(getByText(errorMessage)).toBeTruthy();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should display appropriate error title for each error type', () => {
    const errorTypeTitles: Record<ErrorType, string> = {
      NETWORK_ERROR: 'Network Error',
      TIMEOUT_ERROR: 'Request Timeout',
      INVALID_IMAGE: 'Invalid Image',
      PROCESSING_ERROR: 'Processing Error',
      NO_DETECTIONS: 'No Food Detected',
      UNKNOWN_ERROR: 'Error',
    };

    fc.assert(
      fc.property(
        fc.constantFrom<ErrorType>(
          'NETWORK_ERROR',
          'TIMEOUT_ERROR',
          'INVALID_IMAGE',
          'PROCESSING_ERROR',
          'NO_DETECTIONS',
          'UNKNOWN_ERROR',
        ),
        (errorType: ErrorType) => {
          const {getByText} = render(
            <ErrorMessage
              errorType={errorType}
              errorMessage="Test error message"
            />,
          );

          const expectedTitle = errorTypeTitles[errorType];
          expect(getByText(expectedTitle)).toBeTruthy();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should call onRetry when retry button is pressed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ErrorType>(
          'NETWORK_ERROR',
          'TIMEOUT_ERROR',
          'INVALID_IMAGE',
          'PROCESSING_ERROR',
          'NO_DETECTIONS',
          'UNKNOWN_ERROR',
        ),
        fc.string({minLength: 1, maxLength: 100}),
        (errorType: ErrorType, errorMessage: string) => {
          const onRetry = jest.fn();
          const {getByText} = render(
            <ErrorMessage
              errorType={errorType}
              errorMessage={errorMessage}
              onRetry={onRetry}
              showRetry={true}
            />,
          );

          const retryButton = getByText('Retry');
          fireEvent.press(retryButton);

          expect(onRetry).toHaveBeenCalledTimes(1);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should call onStartOver when start over button is pressed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ErrorType>(
          'NETWORK_ERROR',
          'TIMEOUT_ERROR',
          'INVALID_IMAGE',
          'PROCESSING_ERROR',
          'NO_DETECTIONS',
          'UNKNOWN_ERROR',
        ),
        fc.string({minLength: 1, maxLength: 100}),
        (errorType: ErrorType, errorMessage: string) => {
          const onStartOver = jest.fn();
          const {getByText} = render(
            <ErrorMessage
              errorType={errorType}
              errorMessage={errorMessage}
              onStartOver={onStartOver}
              showStartOver={true}
            />,
          );

          const startOverButton = getByText('Start Over');
          fireEvent.press(startOverButton);

          expect(onStartOver).toHaveBeenCalledTimes(1);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should not display retry button when showRetry is false', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ErrorType>(
          'NETWORK_ERROR',
          'TIMEOUT_ERROR',
          'INVALID_IMAGE',
          'PROCESSING_ERROR',
          'NO_DETECTIONS',
          'UNKNOWN_ERROR',
        ),
        (errorType: ErrorType) => {
          const {queryByText} = render(
            <ErrorMessage
              errorType={errorType}
              errorMessage="Test error"
              showRetry={false}
            />,
          );

          expect(queryByText('Retry')).toBeNull();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should not display start over button when showStartOver is false', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ErrorType>(
          'NETWORK_ERROR',
          'TIMEOUT_ERROR',
          'INVALID_IMAGE',
          'PROCESSING_ERROR',
          'NO_DETECTIONS',
          'UNKNOWN_ERROR',
        ),
        (errorType: ErrorType) => {
          const {queryByText} = render(
            <ErrorMessage
              errorType={errorType}
              errorMessage="Test error"
              showStartOver={false}
            />,
          );

          expect(queryByText('Start Over')).toBeNull();
        },
      ),
      {numRuns: 100},
    );
  });
});
