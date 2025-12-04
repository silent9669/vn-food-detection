import {Platform} from 'react-native';
import Config from 'react-native-config';

export interface ImageProcessorOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'JPEG' | 'PNG';
}

export interface ImageDimensions {
  width: number;
  height: number;
}

class ImageProcessor {
  private readonly maxImageSize: number;
  private readonly defaultQuality: number;

  constructor() {
    this.maxImageSize = parseInt(
      Config.MAX_IMAGE_SIZE || '5242880',
      10,
    ); // 5MB default
    this.defaultQuality = parseFloat(Config.IMAGE_QUALITY || '0.8');
  }

  /**
   * Validate image format
   */
  validateImageFormat(uri: string): {isValid: boolean; error?: string} {
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];
    const extension = uri.substring(uri.lastIndexOf('.'));

    if (!supportedFormats.includes(extension)) {
      return {
        isValid: false,
        error: `Unsupported image format. Supported formats: ${supportedFormats.join(', ')}`,
      };
    }

    return {isValid: true};
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(uri: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      // For React Native
      const RNImage = require('react-native').Image;
      RNImage.getSize(
        uri,
        (width: number, height: number) => {
          resolve({width, height});
        },
        (error: Error) => {
          reject(error);
        },
      );
    });
  }

  /**
   * Calculate new dimensions while maintaining aspect ratio
   */
  calculateResizeDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): ImageDimensions {
    let width = originalWidth;
    let height = originalHeight;

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Resize if width exceeds max
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    // Resize if height still exceeds max
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  /**
   * Resize image to fit within max dimensions
   */
  async resizeImage(
    uri: string,
    options: Partial<ImageProcessorOptions> = {},
  ): Promise<string> {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = this.defaultQuality,
        format = 'JPEG',
      } = options;

      // Get original dimensions
      const originalDimensions = await this.getImageDimensions(uri);

      // Calculate new dimensions
      const newDimensions = this.calculateResizeDimensions(
        originalDimensions.width,
        originalDimensions.height,
        maxWidth,
        maxHeight,
      );

      // If dimensions haven't changed, return original URI
      if (
        newDimensions.width === originalDimensions.width &&
        newDimensions.height === originalDimensions.height
      ) {
        return uri;
      }

      // For React Native, we would use a library like react-native-image-resizer
      // For now, return the original URI as resizing will be handled by the library
      // when it's installed
      console.log(
        `Image would be resized from ${originalDimensions.width}x${originalDimensions.height} to ${newDimensions.width}x${newDimensions.height}`,
      );

      return uri;
    } catch (error) {
      console.error('Error resizing image:', error);
      throw new Error('Failed to resize image');
    }
  }

  /**
   * Compress image to reduce file size
   */
  async compressImage(
    uri: string,
    quality: number = this.defaultQuality,
  ): Promise<string> {
    try {
      // Validate quality
      if (quality < 0 || quality > 1) {
        throw new Error('Quality must be between 0 and 1');
      }

      // For React Native, we would use a library like react-native-image-resizer
      // or react-native-compressor
      // For now, return the original URI
      console.log(`Image would be compressed with quality ${quality}`);

      return uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      // Re-throw the original error if it's already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to compress image');
    }
  }

  /**
   * Convert image URI to base64 string
   */
  async convertToBase64(uri: string): Promise<string> {
    try {
      // For React Native
      if (Platform.OS !== 'web') {
        const RNFS = require('react-native-fs');

        // Read file as base64
        const base64 = await RNFS.readFile(uri, 'base64');
        return base64;
      }

      // For web platform
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove data:image/...;base64, prefix
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Process image for upload (resize, compress, convert to base64)
   */
  async processImageForUpload(
    uri: string,
    options: Partial<ImageProcessorOptions> = {},
  ): Promise<string> {
    try {
      // Validate format
      const validation = this.validateImageFormat(uri);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Resize if needed
      const resizedUri = await this.resizeImage(uri, options);

      // Compress if needed
      const compressedUri = await this.compressImage(
        resizedUri,
        options.quality,
      );

      // Convert to base64
      const base64 = await this.convertToBase64(compressedUri);

      return base64;
    } catch (error) {
      console.error('Error processing image for upload:', error);
      throw error;
    }
  }

  /**
   * Get file size from URI
   */
  async getFileSize(uri: string): Promise<number> {
    try {
      if (Platform.OS !== 'web') {
        const RNFS = require('react-native-fs');
        const stat = await RNFS.stat(uri);
        return stat.size;
      }

      // For web
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  /**
   * Check if image size exceeds maximum
   */
  async isImageTooLarge(uri: string): Promise<boolean> {
    const size = await this.getFileSize(uri);
    return size > this.maxImageSize;
  }
}

// Export singleton instance
export default new ImageProcessor();
