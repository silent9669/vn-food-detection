# Android Release Build and Testing Guide (Task 38)

## Overview

This guide covers building and testing the Android release version of the Vietnamese Food Detection app before Play Store submission.

## Prerequisites

- ✅ Android Studio installed
- ✅ Android SDK configured
- ✅ Physical Android devices for testing (recommended)
- ✅ Backend deployed to Railway (Task 36 complete)
- ✅ `.env.production` configured with Railway URL

## Step 1: Generate Release Keystore

**⚠️ Important**: Do this ONCE and keep the keystore secure!

```bash
cd mobile-app/VNFoodDetection/android/app

# Generate keystore
keytool -genkey -v -keystore release.keystore \
  -alias vnfood-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (remember this!)
# - Your name
# - Organization
# - City, State, Country
```

**Save these securely**:
- Keystore file: `android/app/release.keystore`
- Keystore password
- Key alias: `vnfood-release`
- Key password

### Backup Keystore

```bash
# Copy to safe location
cp android/app/release.keystore ~/Documents/vnfood-keystore-backup.keystore

# Or upload to secure cloud storage
```

## Step 2: Configure Signing

### Create gradle.properties

```bash
# Create android/gradle.properties (add to .gitignore!)
cd mobile-app/VNFoodDetection/android
cat > gradle.properties << EOF
KEYSTORE_PASSWORD=your-keystore-password-here
KEY_PASSWORD=your-key-password-here
EOF
```

### Update .gitignore

```bash
# Add to android/.gitignore
echo "gradle.properties" >> .gitignore
echo "app/release.keystore" >> .gitignore
```

### Verify Signing Configuration

Check `android/app/build.gradle` has:

```groovy
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: project.KEYSTORE_PASSWORD
        keyAlias 'vnfood-release'
        keyPassword System.getenv("KEY_PASSWORD") ?: project.KEY_PASSWORD
    }
}
```

## Step 3: Update Version

Edit `android/app/build.gradle`:

```groovy
defaultConfig {
    applicationId "com.vnfooddetection"
    minSdkVersion 26
    targetSdkVersion 33
    versionCode 1        // Increment for each release
    versionName "1.0.0"  // Semantic versioning
}
```

## Step 4: Build Release AAB (for Play Store)

```bash
cd mobile-app/VNFoodDetection/android

# Clean previous builds
./gradlew clean

# Build release AAB
./gradlew bundleRelease

# Output location:
# android/app/build/outputs/bundle/release/app-release.aab
```

**Expected build time**: 2-5 minutes

### Verify AAB

```bash
# Check file size (should be ~25-35 MB)
ls -lh app/build/outputs/bundle/release/app-release.aab

# Verify signature
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
```

## Step 5: Build Release APKs (for Testing)

```bash
cd mobile-app/VNFoodDetection/android

# Build release APKs
./gradlew assembleRelease

# Output location:
# android/app/build/outputs/apk/release/
# - app-arm64-v8a-release.apk (64-bit ARM - most common)
# - app-armeabi-v7a-release.apk (32-bit ARM)
# - app-x86_64-release.apk (64-bit Intel)
# - app-x86-release.apk (32-bit Intel)
```

## Step 6: Test on Physical Devices

### Recommended Test Devices

Test on at least 3 devices with different:
- **Android versions**: 8.0, 10, 12, 13
- **Screen sizes**: Small (5"), Medium (6"), Large (6.5"+)
- **Manufacturers**: Samsung, Google Pixel, Xiaomi, etc.

### Install APK on Device

```bash
# Connect device via USB
# Enable USB debugging on device

# List connected devices
adb devices

# Install APK (use arm64-v8a for most modern devices)
adb install app/build/outputs/apk/release/app-arm64-v8a-release.apk

# Or install all variants
adb install-multiple app/build/outputs/apk/release/*.apk
```

### Alternative: Install via File Transfer

1. Copy APK to device
2. Open file manager on device
3. Tap APK file
4. Allow installation from unknown sources
5. Install

## Step 7: Testing Checklist

### 🎯 Core Functionality

- [ ] **App Launch**
  - App opens without crashes
  - Home screen displays correctly
  - No error messages on startup

- [ ] **Camera Capture**
  - Camera permission requested
  - Camera preview displays
  - Capture button works
  - Photo is captured successfully
  - Navigation to results screen works

- [ ] **Gallery Selection**
  - Gallery permission requested
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
  - Share dialog opens
  - Can share to other apps

- [ ] **Error Handling**
  - Network errors display correctly
  - Retry button works
  - Start over button works
  - Offline mode handled gracefully

### 📱 UI/UX Testing

- [ ] **Layout**
  - All text is readable
  - Buttons are tappable
  - Images display correctly
  - No UI elements overlap
  - Scrolling works smoothly

- [ ] **Navigation**
  - Back button works
  - Navigation between screens works
  - App doesn't crash on back press

- [ ] **Responsiveness**
  - UI responds to touches
  - No lag or freezing
  - Animations are smooth

### 🔋 Performance Testing

- [ ] **Memory Usage**
  - App uses reasonable memory (~200-400 MB)
  - No memory leaks
  - App doesn't crash after multiple uses

- [ ] **Battery Usage**
  - App doesn't drain battery excessively
  - Camera usage is normal

- [ ] **Network Usage**
  - API calls complete in reasonable time
  - App handles slow networks
  - App handles network interruptions

### 🔒 Permissions Testing

- [ ] **Camera Permission**
  - Permission requested on first use
  - Permission denial handled gracefully
  - Can grant permission from settings

- [ ] **Gallery Permission**
  - Permission requested on first use
  - Permission denial handled gracefully
  - Can grant permission from settings

### 🌐 Backend Integration

- [ ] **API Connection**
  - App connects to Railway backend
  - Health check succeeds
  - Detection API works
  - Responses are parsed correctly

- [ ] **Error Scenarios**
  - Backend down: Error message displays
  - Timeout: Timeout message displays
  - Invalid response: Error handled

### 📊 Edge Cases

- [ ] **Large Images**
  - High resolution images work
  - Images are resized correctly
  - No out of memory errors

- [ ] **Multiple Detections**
  - Multiple food items detected
  - Bounding boxes don't overlap badly
  - Nutrition totals are correct

- [ ] **No Detections**
  - "No food detected" message shows
  - Can retry or start over

- [ ] **Low Confidence**
  - Low confidence warnings display
  - Orange/yellow colors show

## Step 8: Performance Profiling

### Using Android Studio Profiler

1. Open Android Studio
2. Run app on device
3. Open Profiler (View → Tool Windows → Profiler)
4. Monitor:
   - CPU usage
   - Memory usage
   - Network activity
   - Energy usage

### Expected Performance

- **App size**: 25-35 MB per APK
- **Memory usage**: 200-400 MB
- **Cold start time**: 2-3 seconds
- **Detection time**: 1-3 seconds (depends on network)
- **UI responsiveness**: 60 FPS

## Step 9: Test Different Scenarios

### Scenario 1: First Time User

1. Install app
2. Open app
3. Grant permissions
4. Take photo
5. View results
6. Share results

### Scenario 2: Returning User

1. Open app
2. Select from gallery
3. View results
4. Try different image

### Scenario 3: Network Issues

1. Turn off WiFi
2. Open app
3. Try detection
4. Verify error handling
5. Turn on WiFi
6. Retry

### Scenario 4: Low Storage

1. Fill device storage
2. Try to capture photo
3. Verify error handling

## Step 10: Bug Reporting

If you find issues, document:

- **Device**: Model, Android version
- **Steps to reproduce**: Exact steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Logs**: Use `adb logcat` to capture logs

### Capture Logs

```bash
# Clear logs
adb logcat -c

# Reproduce issue

# Capture logs
adb logcat > bug-report.txt
```

## Step 11: Pre-Submission Checklist

Before submitting to Play Store:

- [ ] All tests pass
- [ ] No crashes on any test device
- [ ] Performance is acceptable
- [ ] UI looks good on all screen sizes
- [ ] Permissions work correctly
- [ ] Backend integration works
- [ ] Release keystore is backed up
- [ ] Version number is correct
- [ ] App icon is correct
- [ ] App name is correct

## Common Issues and Solutions

### Issue: "App not installed"

**Solution**: Uninstall previous version first
```bash
adb uninstall com.vnfooddetection
adb install app-arm64-v8a-release.apk
```

### Issue: Signature verification failed

**Solution**: Check keystore configuration
```bash
# Verify keystore
keytool -list -v -keystore android/app/release.keystore

# Check gradle.properties has correct passwords
```

### Issue: App crashes on startup

**Solution**: Check logs
```bash
adb logcat | grep -i "vnfood\|crash\|error"
```

### Issue: Camera not working

**Solution**: Check permissions in device settings
- Settings → Apps → VN Food Detection → Permissions
- Ensure Camera permission is granted

### Issue: Detection fails

**Solution**: Check backend connection
- Verify Railway URL in `.env.production`
- Test health endpoint: `curl https://your-app.railway.app/api/v1/health`
- Check device has internet connection

## Next Steps

After successful testing:

1. ✅ Document any issues found
2. ✅ Fix critical bugs
3. ✅ Re-test after fixes
4. ✅ Prepare Play Store listing (Task 40)
5. ✅ Submit to Play Store

## Play Store Submission Preview

You'll need:
- AAB file (`app-release.aab`)
- App screenshots (5-8 images)
- Feature graphic (1024x500)
- App icon (512x512)
- Short description (80 chars)
- Full description (4000 chars)
- Privacy policy URL

## Testing Timeline

- **Initial build**: 30 minutes
- **Device testing**: 2-3 hours
- **Bug fixes**: Variable
- **Final testing**: 1 hour

**Total**: 4-6 hours

## Conclusion

Thorough testing ensures a smooth user experience and reduces the chance of negative reviews. Test on multiple devices, scenarios, and network conditions before submitting to the Play Store.

**Status after completion**: Ready for Play Store submission! 🚀
