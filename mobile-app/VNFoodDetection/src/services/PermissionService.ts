import {Platform, Alert, Linking} from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
  PermissionStatus,
} from 'react-native-permissions';

export type PermissionType = 'camera' | 'gallery';

export interface PermissionResult {
  granted: boolean;
  status: PermissionStatus;
  canAskAgain: boolean;
}

class PermissionService {
  /**
   * Get the appropriate permission constant based on platform and type
   */
  private getPermission(type: PermissionType): Permission {
    if (type === 'camera') {
      return Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      }) as Permission;
    } else {
      // gallery
      return Platform.select({
        ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
        android:
          Platform.Version >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      }) as Permission;
    }
  }

  /**
   * Check the current status of a permission
   */
  async checkPermissionStatus(type: PermissionType): Promise<PermissionResult> {
    const permission = this.getPermission(type);
    const status = await check(permission);

    return {
      granted: status === RESULTS.GRANTED,
      status,
      canAskAgain: status !== RESULTS.BLOCKED,
    };
  }

  /**
   * Request camera permission with rationale
   */
  async requestCameraPermission(): Promise<PermissionResult> {
    const permission = this.getPermission('camera');
    const currentStatus = await check(permission);

    // If already granted, return immediately
    if (currentStatus === RESULTS.GRANTED) {
      return {
        granted: true,
        status: currentStatus,
        canAskAgain: true,
      };
    }

    // If blocked, show alert to open settings
    if (currentStatus === RESULTS.BLOCKED) {
      this.showSettingsAlert('camera');
      return {
        granted: false,
        status: currentStatus,
        canAskAgain: false,
      };
    }

    // Request permission
    const status = await request(permission);

    return {
      granted: status === RESULTS.GRANTED,
      status,
      canAskAgain: status !== RESULTS.BLOCKED,
    };
  }

  /**
   * Request gallery/photo library permission with rationale
   */
  async requestGalleryPermission(): Promise<PermissionResult> {
    const permission = this.getPermission('gallery');
    const currentStatus = await check(permission);

    // If already granted, return immediately
    if (currentStatus === RESULTS.GRANTED) {
      return {
        granted: true,
        status: currentStatus,
        canAskAgain: true,
      };
    }

    // If blocked, show alert to open settings
    if (currentStatus === RESULTS.BLOCKED) {
      this.showSettingsAlert('gallery');
      return {
        granted: false,
        status: currentStatus,
        canAskAgain: false,
      };
    }

    // Request permission
    const status = await request(permission);

    return {
      granted: status === RESULTS.GRANTED,
      status,
      canAskAgain: status !== RESULTS.BLOCKED,
    };
  }

  /**
   * Show alert to guide user to app settings
   */
  private showSettingsAlert(type: PermissionType): void {
    const permissionName = type === 'camera' ? 'Camera' : 'Photo Library';
    const message =
      type === 'camera'
        ? 'Camera access is required to capture photos of Vietnamese food. Please enable it in Settings.'
        : 'Photo library access is required to select images of Vietnamese food. Please enable it in Settings.';

    Alert.alert(
      `${permissionName} Permission Required`,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ],
      {cancelable: false},
    );
  }

  /**
   * Show rationale dialog before requesting permission
   */
  showPermissionRationale(type: PermissionType): Promise<boolean> {
    return new Promise(resolve => {
      const permissionName = type === 'camera' ? 'Camera' : 'Photo Library';
      const message =
        type === 'camera'
          ? 'This app needs camera access to capture photos of Vietnamese food for detection and nutrition analysis.'
          : 'This app needs photo library access to select images of Vietnamese food for detection and nutrition analysis.';

      Alert.alert(
        `${permissionName} Access`,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Continue',
            onPress: () => resolve(true),
          },
        ],
        {cancelable: false},
      );
    });
  }
}

export default new PermissionService();
