# iOS Release Build and Testing Guide (Task 39)

## Overview

This guide covers building and testing the iOS release version of the Vietnamese Food Detection app before App Store submission.

## Prerequisites

- ✅ Mac with Xcode installed (Xcode 14+)
- ✅ Apple Developer account ($99/year)
- ✅ Physical iOS devices for testing (recommended)
- ✅ Backend deployed to Railway (Task 36 complete)
- ✅ `.env.production` configured with Railway URL

## Step 1: Configure Code Signing

### 1.1 Open Project in Xcode

```bash
cd mobile-app/VNFoodDetection/ios
open VNFoodDetection.xcworkspace
```

**⚠️ Important**: Open `.xcworkspace`, NOT `.xcodeproj`

### 1.2 Select Team

1. Select project in navigator (VNFoodDetection)
2. Select target (VNFoodDetection)
3. Go to "Signing & Capabilities" tab
4. Check "Automatically manage signing"
5. Select your Team from dropdown
6. Xcode will create provisioning profiles automatically

### 1.3 Configure Bundle Identifier

Ensure Bundle Identifier is unique:
```
com.yourcompany.vnfooddetection
```

Change if needed to match your Apple Developer account.

### 1.4 Verify Capabilities

Ensure these are enabled:
- ✅ Camera usage
- ✅ Photo Library usage

## Step 2: Update Version and Build Number

In Xcode:
1. Select project → Target → General tab
2. Update:
   - **Version**: 1.0.0 (semantic versioning)
   - **Build**: 1 (increment for each submission)

Or edit `ios/VNFoodDetection/Info.plist`:
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

## Step 3: Configure Release Scheme

### 3.1 Edit Scheme

1. Product → Scheme → Edit Scheme
2. Select "Run" in sidebar
3. Change "Build Configuration" to **Release**
4. Uncheck "Debug executable"

### 3.2 Verify Release Settings

1. Select project → Build Settings
2. Search for "Optimization Level"
3. Ensure Release is set to "Fastest, Smallest [-Os]"

## Step 4: Build for Testing (Simulator)

### 4.1 Select Simulator

1. Select any iOS Simulator from device dropdown
2. Product → Build (⌘B)
3. Verify build succeeds

### 4.2 Run on Simulator

1. Product → Run (⌘R)
2. Test basic functionality
3. Note: Camera won't work on simulator

## Step 5: Build for Physical Device

### 5.1 Connect Device

1. Connect iPhone/iPad via USB
2. Trust computer on device
3. Select device from dropdown in Xcode

### 5.2 Build and Run

1. Product → Clean Build Folder (⇧⌘K)
2. Product → Build (⌘B)
3. Product → Run (⌘R)
4. App installs and launches on device

### 5.3 Troubleshooting Device Build

**Issue**: "Failed to verify code signature"
- Solution: Check Team selection in Signing & Capabilities

**Issue**: "Device not registered"
- Solution: Register device in Apple Developer portal

**Issue**: "Provisioning profile doesn't include device"
- Solution: Xcode will prompt to register device automatically

## Step 6: Archive for Distribution

### 6.1 Select Generic iOS Device

1. Change scheme to "Any iOS Device (arm64)"
2. This is required for archiving

### 6.2 Create Archive

1. Product → Archive
2. Wait for archive to complete (2-5 minutes)
3. Organizer window opens automatically

### 6.3 Verify Archive

In Organizer:
- Check app name
- Check version number
- Check build number
- Check date

## Step 7: Export for Testing

### 7.1 Export Ad Hoc Build

1. In Organizer, select archive
2. Click "Distribute App"
3. Select "Ad Hoc"
4. Click "Next"
5. Select distribution options:
   - ✅ App Thinning: None
   - ✅ Rebuild from Bitcode: No
   - ✅ Strip Swift symbols: Yes
6. Select signing certificate
7. Click "Export"
8. Save IPA file

### 7.2 Install on Test Devices

**Option 1: Xcode**
1. Window → Devices and Simulators
2. Select device
3. Click "+" under Installed Apps
4. Select IPA file

**Option 2: Apple Configurator**
1. Install Apple Configurator 2
2. Connect device
3. Drag IPA to device

**Option 3: TestFlight** (recommended for multiple testers)
1. Upload to App Store Connect
2. Add internal testers
3. Testers install via TestFlight app

## Step 8: Testing Checklist

### 🎯 Core Functionality

- [ ] **App Launch**
  - App opens without crashes
  - Home screen displays correctly
  - No error messages on startup
  - Launch screen displays correctly

- [ ] **Camera Capture**
  - Camera permission requested
  - Permission dialog shows correct message
  - Camera preview displays
  - Capture button works
  - Photo is captured successfully
  - Navigation to results screen works

- [ ] **Gallery Selection**
  - Photo library permission requested
  - Permission dialog shows correct message
  - Gallery opens
  - Image selection works
  - Navigation to results screen works

- [ ] **Detection Flow**
  - Image displays in results screen
  - Loading indicator shows
  - API call succeeds
  - Detection results display
  - Bounding boxes render correctly
  - Dish names display
  - Confidence scores show
  - Nutrition card displays

- [ ] **Share Functionality**
  - Share button appears
  - Screenshot captures
  - Share sheet opens
  - Can share to Messages, Mail, etc.

- [ ] **Error Handling**
  - Network errors display correctly
  - Retry button works
  - Start over button works
  - Offline mode handled gracefully

### 📱 iOS-Specific Testing

- [ ] **Safe Area**
  - Content doesn't overlap notch (iPhone X+)
  - Content doesn't overlap home indicator
  - Status bar displays correctly

- [ ] **Dark Mode**
  - App looks good in dark mode
  - Colors are appropriate
  - Text is readable

- [ ] **Dynamic Type**
  - Text scales with system font size
  - Layout adjusts appropriately

- [ ] **Rotation**
  - App handles rotation gracefully
  - Layout adjusts correctly

- [ ] **Multitasking**
  - App handles background/foreground
  - State is preserved
  - Camera releases properly

### 🔋 Performance Testing

- [ ] **Memory Usage**
  - App uses reasonable memory (~150-300 MB)
  - No memory warnings
  - No crashes after extended use

- [ ] **Battery Usage**
  - App doesn't drain battery excessively
  - Camera usage is normal
  - No excessive CPU usage

- [ ] **Launch Time**
  - Cold launch < 3 seconds
  - Warm launch < 1 second

### 🔒 Permissions Testing

- [ ] **Camera Permission**
  - Permission requested on first use
  - Permission dialog shows correct message
  - Permission denial handled gracefully
  - Can grant permission from Settings

- [ ] **Photo Library Permission**
  - Permission requested on first use
  - Permission dialog shows correct message
  - Permission denial handled gracefully
  - Can grant permission from Settings

### 🌐 Backend Integration

- [ ] **API Connection**
  - App connects to Railway backend
  - Health check succeeds
  - Detection API works
  - Responses are parsed correctly
  - HTTPS works correctly

- [ ] **Error Scenarios**
  - Backend down: Error message displays
  - Timeout: Timeout message displays
  - Invalid response: Error handled

## Step 9: Test on Multiple Devices

### Recommended Test Devices

Test on at least 3 devices:

**iPhone Models**:
- iPhone SE (small screen, no notch)
- iPhone 12/13/14 (standard size, notch)
- iPhone 14 Pro Max (large screen, Dynamic Island)

**iOS Versions**:
- iOS 13.0 (minimum supported)
- iOS 15.x
- iOS 16.x (latest)

**iPad** (optional):
- Test if you plan to support iPad

## Step 10: Performance Profiling

### Using Xcode Instruments

1. Product → Profile (⌘I)
2. Select template:
   - **Time Profiler**: CPU usage
   - **Allocations**: Memory usage
   - **Leaks**: Memory leaks
   - **Energy Log**: Battery usage

### Expected Performance

- **App size**: 30-40 MB
- **Memory usage**: 150-300 MB
- **Cold start time**: 2-3 seconds
- **Detection time**: 1-3 seconds (depends on network)
- **Frame rate**: 60 FPS

## Step 11: Test Different Scenarios

### Scenario 1: First Time User

1. Install app
2. Open app
3. Grant camera permission
4. Take photo
5. View results
6. Share results

### Scenario 2: Permission Denied

1. Deny camera permission
2. Verify error message
3. Tap "Go to Settings"
4. Grant permission
5. Return to app
6. Verify camera works

### Scenario 3: Network Issues

1. Enable Airplane Mode
2. Open app
3. Try detection
4. Verify error handling
5. Disable Airplane Mode
6. Retry

### Scenario 4: Background/Foreground

1. Start detection
2. Press home button
3. Wait 10 seconds
4. Return to app
5. Verify state is preserved

## Step 12: TestFlight Beta Testing

### 12.1 Upload to App Store Connect

1. In Xcode Organizer, select archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Click "Upload"
5. Wait for processing (10-30 minutes)

### 12.2 Add Internal Testers

1. Go to App Store Connect
2. Select app
3. Go to TestFlight tab
4. Add internal testers (up to 100)
5. Testers receive email invitation

### 12.3 Add External Testers (Optional)

1. Create external test group
2. Add testers (up to 10,000)
3. Submit for Beta App Review
4. Wait for approval (1-2 days)

### 12.4 Collect Feedback

- Monitor crash reports
- Read tester feedback
- Fix critical issues
- Upload new build if needed

## Step 13: Pre-Submission Checklist

- [ ] All tests pass on physical devices
- [ ] No crashes on any test device
- [ ] Performance is acceptable
- [ ] UI looks good on all screen sizes
- [ ] Safe area handled correctly
- [ ] Permissions work correctly
- [ ] Backend integration works
- [ ] App icon is correct (1024x1024)
- [ ] Launch screen is correct
- [ ] Version and build numbers are correct
- [ ] Privacy policy URL ready
- [ ] App Store screenshots ready

## Step 14: Common Issues and Solutions

### Issue: "Code signing failed"

**Solution**: 
1. Check Team selection
2. Verify Apple Developer account is active
3. Try "Automatically manage signing"

### Issue: "Provisioning profile doesn't match"

**Solution**:
1. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
2. Clean build folder: ⇧⌘K
3. Rebuild

### Issue: "App crashes on launch"

**Solution**:
1. Check crash logs in Xcode (Window → Devices and Simulators → View Device Logs)
2. Look for stack trace
3. Check for missing resources or configuration

### Issue: "Camera not working"

**Solution**:
1. Check Info.plist has camera usage description
2. Check permissions in device Settings
3. Verify camera permission is requested in code

### Issue: "Detection fails"

**Solution**:
1. Verify Railway URL in `.env.production`
2. Test health endpoint
3. Check device has internet connection
4. Check App Transport Security settings

## Step 15: App Store Submission

### 15.1 Prepare App Store Connect

1. Go to App Store Connect
2. Create new app
3. Fill in app information:
   - Name
   - Subtitle
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL

### 15.2 Upload Screenshots

Required sizes:
- 6.5" Display (iPhone 14 Pro Max): 1284 x 2778
- 5.5" Display (iPhone 8 Plus): 1242 x 2208

### 15.3 Submit for Review

1. Select build from TestFlight
2. Fill in review information
3. Submit for review
4. Wait for approval (1-3 days)

## Testing Timeline

- **Initial setup**: 1 hour
- **Device testing**: 2-3 hours
- **TestFlight setup**: 1 hour
- **Beta testing**: 1-3 days
- **Bug fixes**: Variable
- **Final testing**: 1 hour

**Total**: 1-2 weeks (including beta testing)

## Conclusion

Thorough iOS testing ensures compliance with Apple's guidelines and provides a great user experience. Test on multiple devices, iOS versions, and scenarios before submitting to the App Store.

**Status after completion**: Ready for App Store submission! 🚀

## Additional Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [Xcode Help](https://help.apple.com/xcode/)
