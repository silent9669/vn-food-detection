// Navigation types

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Results: {
    imageUri: string;
  };
};

// Navigation prop types for screens
export type NavigationProps = {
  navigation: any; // Will be properly typed with NavigationProp from @react-navigation/native
  route?: any;
};
