import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render camera and gallery buttons', () => {
    const {getByText} = render(<HomeScreen />);

    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByText('Choose from Gallery')).toBeTruthy();
  });

  it('should render app title and description', () => {
    const {getByText} = render(<HomeScreen />);

    expect(getByText(/Vietnamese Food Detection/i)).toBeTruthy();
    expect(
      getByText(/Detect and identify Vietnamese dishes/i),
    ).toBeTruthy();
  });

  it('should navigate to Camera screen when Take Photo is pressed', () => {
    const {getByText} = render(<HomeScreen />);

    const cameraButton = getByText('Take Photo');
    fireEvent.press(cameraButton);

    expect(mockNavigate).toHaveBeenCalledWith('Camera');
  });

  it('should render feature list', () => {
    const {getAllByText} = render(<HomeScreen />);

    expect(getAllByText(/30\+ Vietnamese dishes/i).length).toBeGreaterThan(0);
    expect(getAllByText(/97%\+ accuracy/i).length).toBeGreaterThan(0);
    expect(getAllByText(/Nutritional information/i).length).toBeGreaterThan(0);
  });
});
