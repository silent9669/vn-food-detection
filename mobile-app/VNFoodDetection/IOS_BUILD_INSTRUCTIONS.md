# iOS Build Instructions

## iOS Build Configuration

### Platform Version
- **Minimum iOS Version:** 13.0
- **Target iOS Version:** Latest
- **Supported Devices:** iPhone, iPad

### Permissions Configured
✅ Camera access (NSCameraUsageDescription)
✅ Photo library access (NSPhotoLibraryUsageDescription)
✅ Photo library add (NSPhotoLibraryAddUsageDescription)

## Prerequisites

1. **macOS** with Xcode installed
2. **Xcode 14+** (latest recommended)
3. **CocoaPods** installed
4. **Apple Developer Account** (for device testing and App Store)

### Install CocoaPods
```bash
sudo gem install cocoapods
```

## Setup

### 1. Install Dependencies
```bash
cd mobile-app/VNFoodDetection

# Install npm packages
npm install

# Install iOS pods
cd ios
pod install
cd ..
```

### 2. Open in Xcode
```bash
cd ios
open VNFoodDetection.xcworkspace
```

**Important:** Always open `.xcworkspace`, NOT `.xcodeproj`!

## Building for iOS

### Debug Build (Simulator)

#### Via Command Line
```bash
# Run on iOS simulator
npm run ios

# Or specify simulator
npx react-native run-ios --simulator="iPhone 14 Pro"
```

#### Via Xcode
1. Open `VNFoodDetection.xcworkspace`
2. Select target device/simulator
3. Click Run (⌘R)

### Debug Build (Physical Device)

1. Connect iPhone/iPad via USB
2. Open Xcode
3. Select your device from device list
4. Click Run (⌘R)

**First time setup:**
- Trust developer certificate on device
- Settings → General → VPN & Device Management → Trust

### Release Build

#### Via Xcode (Recommended)

1. Open `VNFoodDetection.xcworkspace`
2. Select "Any iOS Device (arm64)"
3. Product → Archive
4. Wait for archive to complete
5. Organizer window opens automatically

#### Via Command Line
```bash
cd ios

# Build release
xcodebuild -workspace VNFoodDetection.xcworkspace \
  -scheme VNFoodDetection \
  -configuration Release \
  -archivePath build/VNFoodDetection.xcarchive \
  archive
```

## Code Signing

### Development Signing

1. Open Xcode
2. Select project in navigator
3. Select "VNFoodDetection" target
4. Go to "Signing & Capabilities" tab
5. Check "Automatically manage signing"
6. Select your Team

### Distribution Signing (App Store)

1. Create App ID in Apple Developer Portal
2. Create Distribution Certificate
3. Create Provisioning Profile
4. In Xcode:
   - Select "Release" configuration
   - Choose distribution certificate
   - Select provisioning profile

## App Store Submission

### 1. Create App in App Store Connect
- Go to https://appstoreconnect.apple.com
- Create new app
- Fill in app information

### 2. Archive the App
```bash
# In Xcode
Product → Archive
```

### 3. Upload to App Store Connect
1. After archive completes, Organizer opens
2. Select your archive
3. Click "Distribute App"
4. Choose "App Store Connect"
5. Follow the wizard

### 4. Submit for Review
1. Go to App Store Connect
2. Select your app
3. Fill in all required information:
   - Screenshots
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL
4. Submit for review

## Configuration

### Bundle Identifier
Default: `com.vnfooddetection`

To change:
1. Open Xcode
2. Select project
3. Select target
4. General tab → Bundle Identifier

### Version Management

Update in `Info.plist` or Xcode:
- **Version:** 1.0.0 (CFBundleShortVersionString)
- **Build:** 1 (CFBundleVersion)

Increment for each release:
- Version: Major.Minor.Patch (1.0.0 → 1.0.1)
- Build: Integer (1 → 2)

### App Icons

Place icons in:
```
ios/VNFoodDetection/Images.xcassets/AppIcon.appiconset/
```

Required sizes:
- 20x20 @2x, @3x
- 29x29 @2x, @3x
- 40x40 @2x, @3x
- 60x60 @2x, @3x
- 1024x1024 (App Store)

### Launch Screen

Edit:
```
ios/VNFoodDetection/LaunchScreen.storyboard
```

## Testing

### Run Tests
```bash
npm test
```

### Test on Device
1. Connect device
2. Select device in Xcode
3. Run (⌘R)
4. Test all features:
   - Camera capture
   - Gallery selection
   - Food detection
   - Share functionality

### TestFlight (Beta Testing)

1. Archive app
2. Upload to App Store Connect
3. Go to TestFlight tab
4. Add internal/external testers
5. Distribute build

## Troubleshooting

### Pod Install Fails
```bash
cd ios
pod deintegrate
pod install
```

### Build Fails
```bash
# Clean build
cd ios
xcodebuild clean

# Or in Xcode
Product → Clean Build Folder (⌘⇧K)
```

### Signing Issues
```bash
# Reset signing
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Re-download certificates
Xcode → Preferences → Accounts → Download Manual Profiles
```

### Module Not Found
```bash
# Reinstall dependencies
cd mobile-app/VNFoodDetection
rm -rf node_modules ios/Pods
npm install
cd ios && pod install
```

## Performance Optimization

### Enable Hermes
Already enabled by default in React Native 0.82+

### Reduce Bundle Size
- Use release build
- Enable bitcode (if needed)
- Strip debug symbols

### Optimize Images
- Use appropriate resolutions
- Compress images
- Use WebP format where possible

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install CocoaPods
  run: |
    cd ios
    pod install

- name: Build iOS
  run: |
    xcodebuild -workspace ios/VNFoodDetection.xcworkspace \
      -scheme VNFoodDetection \
      -configuration Release \
      -archivePath build/VNFoodDetection.xcarchive \
      archive
```

### Fastlane (Recommended)
```ruby
# Fastfile
lane :beta do
  build_app(scheme: "VNFoodDetection")
  upload_to_testflight
end

lane :release do
  build_app(scheme: "VNFoodDetection")
  upload_to_app_store
end
```

## App Store Requirements

### Screenshots
Required for:
- 6.7" (iPhone 14 Pro Max)
- 6.5" (iPhone 11 Pro Max)
- 5.5" (iPhone 8 Plus)
- iPad Pro (12.9")

### App Privacy
Declare in App Store Connect:
- Camera usage
- Photo library access
- Network requests

### App Review Guidelines
Ensure compliance with:
- Privacy policy
- Data handling
- Content guidelines
- Technical requirements

## Notes

- Always test on physical devices before submission
- Keep provisioning profiles up to date
- Test on multiple iOS versions
- Verify all permissions work correctly
- Test in different network conditions
- Ensure app works offline (where applicable)

## Support

For iOS build issues:
1. Check Xcode console for errors
2. Verify pod installation
3. Check code signing settings
4. Review Apple Developer documentation
5. Check React Native iOS documentation

## Resources

- **Apple Developer:** https://developer.apple.com
- **App Store Connect:** https://appstoreconnect.apple.com
- **React Native iOS:** https://reactnative.dev/docs/running-on-device
- **CocoaPods:** https://cocoapods.org
- **Fastlane:** https://fastlane.tools
