import {launchImageLibrary, ImagePickerResponse, Asset} from 'react-native-image-picker';
import PermissionService from './PermissionService';
import Config from 'react-native-config';

export interface PickImageResult {
  success: boolean;
  imageUri?: string;
  error?: string;
  cancelled?: boolean;
}

class ImagePickerService {
  /**
   * Pick an image from the device gallery
   */
  async pickImageFromGallery(): Promise<PickImageResult> {
    try {
      // Request gallery permission first
      const permissionResult = await PermissionService.requestGalleryPermission();

      if (!permissionResult.granted) {
        return {
          success: false,
          error: 'Gallery permission is required to select images',
        };
      }

      // Get max image size from config, default to 2048
      const maxImageSize = parseInt(Config.MAX_IMAGE_SIZE || '2048', 10);
      const imageQuality = parseFloat(Config.IMAGE_QUALITY || '0.8');

      // Launch image picker
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: imageQuality,
        maxWidth: maxImageSize,
        maxHeight: maxImageSize,
        selectionLimit: 1,
      });

      // Handle user cancellation
      if (result.didCancel) {
        return {
          success: false,
          cancelled: true,
        };
      }

      // Handle errors
      if (result.errorCode || result.errorMessage) {
        return {
          success: false,
          error: result.errorMessage || `Error code: ${result.errorCode}`,
        };
      }

      // Extract image URI
      const asset: Asset | undefined = result.assets?.[0];
      if (!asset || !asset.uri) {
        return {
          success: false,
          error: 'No image was selected',
        };
      }

      return {
        success: true,
        imageUri: asset.uri,
      };
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export default new ImagePickerService();
