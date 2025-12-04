# Platform-Specific UI Adaptations Guide

This document describes the platform-specific UI adaptations implemented in the Vietnamese Food Detection mobile app to ensure optimal user experience on both iOS and Android platforms.

## Overview

The app uses React Native's `Platform.select()` API to apply platform-specific styling that follows:
- **iOS**: Apple's Human Interface Guidelines with smooth shadows and rounded corners
- **Android**: Material Design principles with elevation and sharper corners

## Platform Differences Summary

| Element | iOS | Android |
|---------|-----|---------|
| **Card Border Radius** | 16px | 12px |
| **Button Border Radius** | 12px | 8px |
| **Shadow/Elevation** | Shadow with opacity | Material elevation |
| **Font Weight (Bold)** | 600 | bold |
| **Font Weight (Medium)** | 500 | normal |
| **Border Width** | hairlineWidth | 1px |
| **Safe Area Padding** | Extra padding for notch/home indicator | Standard padding |

## Implementation Details

### 1. HomeScreen

**Card Styling:**
```typescript
card: {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
  borderRadius: Platform.select({ios: 16, android: 12}),
}
```

**Button Styling:**
- iOS: 12px border radius, 12px vertical padding
- Android: 8px border radius, 8px vertical padding

**Typography:**
- iOS: Font weight 600 for titles
- Android: Font weight bold for titles

### 2. ResultsScreen

**Card Shadows:**
- iOS: Soft shadows with shadowOpacity 0.1
- Android: Material elevation 4

**Action Buttons:**
- iOS: 12px border radius, 32px bottom margin
- Android: 8px border radius, 24px bottom margin

**Results Cards:**
- All cards use platform-specific shadows and border radius
- No results card has slightly stronger shadow on iOS (opacity 0.15)

### 3. CameraScreen

**Safe Area Handling:**
```typescript
topBar: {
  paddingTop: Platform.select({ios: 60, android: 16}), // iOS notch
}

bottomBar: {
  paddingBottom: Platform.select({ios: 40, android: 24}), // iOS home indicator
}
```

**Capture Button:**
- iOS: 75x75px with shadow
- Android: 70x70px without shadow

**Button Styling:**
- iOS: Larger padding (14px), rounded corners (12px), shadow effects
- Android: Standard padding (12px), Material elevation

### 4. DetectionOverlay

**Bounding Box Labels:**
```typescript
labelContainer: {
  paddingHorizontal: Platform.select({ios: 10, android: 8}),
  paddingVertical: Platform.select({ios: 6, android: 4}),
  borderRadius: Platform.select({ios: 6, android: 4}),
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.3,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
}
```

**Typography:**
- iOS: Font size 13px for dish names, weight 600
- Android: Font size 12px for dish names, weight bold

### 5. NutritionCard

**Card Styling:**
- iOS: 16px border radius, soft shadows
- Android: 12px border radius, elevation 4

**Nutrient Rows:**
- iOS: 14px vertical padding
- Android: 12px vertical padding
- Both use hairlineWidth for borders

**Item Containers:**
- iOS: 14px padding, 10px border radius
- Android: 12px padding, 8px border radius

### 6. LoadingIndicator

**Container Padding:**
- iOS: 40px padding
- Android: 32px padding

**Progress Bar:**
- iOS: 6px height, 3px border radius
- Android: 8px height, 4px border radius

**Typography:**
- iOS: Font weight 500 for message
- Android: Normal font weight

### 7. ErrorMessage

**Card Styling:**
- iOS: Soft shadows (opacity 0.15), 16px border radius
- Android: Elevation 4, 12px border radius

**Icon Size:**
- iOS: 26px
- Android: 24px

**Button Border Radius:**
- iOS: 10px
- Android: 8px

## Testing Recommendations

### iOS Testing
1. Test on devices with notch (iPhone X and later)
2. Verify safe area padding on top and bottom
3. Check shadow rendering on light and dark backgrounds
4. Verify font weights appear correctly (600 vs bold)
5. Test on different screen sizes (iPhone SE, standard, Plus/Max)

### Android Testing
1. Test on devices with different Android versions (API 26+)
2. Verify Material elevation renders correctly
3. Check that buttons follow Material Design guidelines
4. Test on different screen densities (mdpi, hdpi, xhdpi, xxhdpi)
5. Verify navigation bar handling on gesture navigation devices

## Best Practices

1. **Always use Platform.select() for visual differences**
   - Don't use conditional rendering unless necessary
   - Keep platform-specific code in StyleSheet definitions

2. **Use hairlineWidth for thin borders**
   - More consistent across devices
   - Automatically adjusts to screen density

3. **Safe area handling**
   - iOS needs extra padding for notch and home indicator
   - Android typically doesn't need extra padding

4. **Shadow vs Elevation**
   - iOS: Use shadow properties (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
   - Android: Use elevation property (simpler, more performant)

5. **Font weights**
   - iOS: Use numeric values (400, 500, 600, 700)
   - Android: Use string values (normal, bold)
   - Platform.select() handles the difference

## Performance Considerations

- Platform-specific styles are resolved at build time
- No runtime performance impact
- StyleSheet.create() optimizes style objects
- Shadows on iOS can impact performance if overused (we use them sparingly)

## Future Enhancements

1. **Dynamic Type Support (iOS)**
   - Support iOS Dynamic Type for accessibility
   - Scale fonts based on user preferences

2. **Dark Mode**
   - Add platform-specific dark mode colors
   - iOS: Use system colors
   - Android: Use Material dark theme

3. **Haptic Feedback**
   - iOS: Use UIImpactFeedbackGenerator
   - Android: Use Vibration API with different patterns

4. **Platform-Specific Animations**
   - iOS: Spring animations with specific damping
   - Android: Material motion with standard durations

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
- [React Native Platform Specific Code](https://reactnative.dev/docs/platform-specific-code)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

## Conclusion

The platform-specific UI adaptations ensure that the app feels native on both iOS and Android while maintaining a consistent feature set and user experience. Users on each platform will see familiar UI patterns and interactions that match their expectations.
