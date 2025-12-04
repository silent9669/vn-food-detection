# Build Instructions

## Android Build Configuration

### SDK Versions
- **minSdkVersion:** 26 (Android 8.0)
- **targetSdkVersion:** 33 (Android 13)
- **compileSdkVersion:** 36

### Build Features
✅ ABI splits enabled (smaller APK sizes)
✅ ProGuard configured for release builds
✅ Resource shrinking enabled
✅ MultiDex enabled

### Supported ABIs
- armeabi-v7a (32-bit ARM)
- arm64-v8a (64-bit ARM)
- x86 (32-bit Intel)
- x86_64 (64-bit Intel)

## Building for Android

### Debug Build
```bash
cd android
./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release Build (AAB for Play Store)
```bash
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Release Build (APK)
```bash
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/
# Multiple APKs will be generated (one per ABI)
```

## Release Signing

### Generate Release Keystore
```bash
cd android/app
keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing
1. Create `android/gradle.properties` (add to .gitignore):
```properties
KEYSTORE_PASSWORD=your-keystore-password
KEY_PASSWORD=your-key-password
```

2. Update `android/app/build.gradle` release signing config:
```groovy
release {
    storeFile file('release.keystore')
    storePassword System.getenv("KEYSTORE_PASSWORD") ?: project.KEYSTORE_PASSWORD
    keyAlias 'release'
    keyPassword System.getenv("KEY_PASSWORD") ?: project.KEY_PASSWORD
}
```

## Testing Builds

### Install Debug APK
```bash
cd android
./gradlew installDebug
```

### Install Release APK
```bash
cd android
./gradlew installRelease
```

### Test on Device
```bash
# List connected devices
adb devices

# Install specific APK
adb install app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

## ProGuard Configuration

ProGuard rules are configured in `android/app/proguard-rules.pro`:
- React Native core
- React Native Paper
- React Native Vision Camera
- React Native Image Picker
- React Native Permissions
- React Native Config
- React Native Share
- OkHttp

## Build Optimization

### APK Size Reduction
- ✅ ABI splits (separate APKs per architecture)
- ✅ ProGuard minification
- ✅ Resource shrinking
- ✅ Hermes engine (smaller bundle)

### Expected APK Sizes
- arm64-v8a: ~25-30 MB
- armeabi-v7a: ~20-25 MB
- x86_64: ~30-35 MB
- x86: ~25-30 MB

## Troubleshooting

### Build Fails
```bash
# Clean build
cd android
./gradlew clean

# Rebuild
./gradlew assembleDebug
```

### ProGuard Issues
Check `android/app/build/outputs/mapping/release/` for:
- `mapping.txt` - Obfuscation mapping
- `seeds.txt` - Classes kept by ProGuard
- `usage.txt` - Removed code

### Signing Issues
```bash
# Verify keystore
keytool -list -v -keystore android/app/release.keystore

# Check APK signature
jarsigner -verify -verbose -certs app-release.apk
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build Android Release
  run: |
    cd android
    ./gradlew bundleRelease
  env:
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
    KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
```

## Play Store Submission

1. Build AAB: `./gradlew bundleRelease`
2. Upload to Play Console
3. Fill in store listing
4. Submit for review

## Version Management

Update version in `android/app/build.gradle`:
```groovy
defaultConfig {
    versionCode 2  // Increment for each release
    versionName "1.1.0"  // Semantic versioning
}
```

## Notes

- Current signing uses debug keystore (NOT for production!)
- Generate and configure release keystore before Play Store submission
- Keep keystore file secure and backed up
- Never commit keystore or passwords to git
- Test release builds on multiple devices before submission
