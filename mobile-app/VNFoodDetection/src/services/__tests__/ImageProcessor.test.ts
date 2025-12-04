import fc from 'fast-check';
import ImageProcessor from '../ImageProcessor';

// Mock react-native-config
jest.mock('react-native-config', () => ({
  MAX_IMAGE_SIZE: '5242880',
  IMAGE_QUALITY: '0.8',
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  Image: {
    getSize: jest.fn((uri, success, failure) => {
      // Mock successful image size retrieval
      success(1920, 1080);
    }),
  },
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  readFile: jest.fn().mockResolvedValue('base64encodedstring'),
  stat: jest.fn().mockResolvedValue({size: 1024000}),
}));

describe('ImageProcessor Tests', () => {
  // **Feature: mobile-app, Property 4: Unsupported format rejection**
  describe('Property 4: Unsupported format rejection', () => {
    it('should reject unsupported image formats', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.bmp', '.gif', '.tiff', '.webp', '.svg', '.pdf', '.doc'),
          fc.string({minLength: 1, maxLength: 20}),
          (extension, filename) => {
            const imageUri = `file:///${filename}${extension}`;
            const result = ImageProcessor.validateImageFormat(imageUri);

            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Unsupported image format');
            expect(result.error).toContain('Supported formats');
          },
        ),
        {numRuns: 50},
      );
    });

    it('should accept supported image formats', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'),
          fc.string({minLength: 1, maxLength: 20}),
          (extension, filename) => {
            const imageUri = `file:///${filename}${extension}`;
            const result = ImageProcessor.validateImageFormat(imageUri);

            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          },
        ),
        {numRuns: 50},
      );
    });
  });

  describe('Image dimension calculations', () => {
    it('should not exceed max dimensions when resizing', () => {
      fc.assert(
        fc.property(
          fc.integer({min: 100, max: 2000}), // original width
          fc.integer({min: 100, max: 2000}), // original height
          fc.integer({min: 200, max: 1920}), // max width
          fc.integer({min: 200, max: 1080}), // max height
          (origWidth, origHeight, maxWidth, maxHeight) => {
            const result = ImageProcessor.calculateResizeDimensions(
              origWidth,
              origHeight,
              maxWidth,
              maxHeight,
            );

            // Result should not exceed max dimensions
            expect(result.width).toBeLessThanOrEqual(maxWidth);
            expect(result.height).toBeLessThanOrEqual(maxHeight);
            
            // Result should be positive
            expect(result.width).toBeGreaterThan(0);
            expect(result.height).toBeGreaterThan(0);
          },
        ),
        {numRuns: 50},
      );
    });

    it('should not upscale images', () => {
      fc.assert(
        fc.property(
          fc.integer({min: 100, max: 1000}), // small width
          fc.integer({min: 100, max: 1000}), // small height
          (width, height) => {
            const result = ImageProcessor.calculateResizeDimensions(
              width,
              height,
              2000,
              2000,
            );

            // Should not upscale
            expect(result.width).toBeLessThanOrEqual(width);
            expect(result.height).toBeLessThanOrEqual(height);
          },
        ),
        {numRuns: 50},
      );
    });
  });

  describe('Image dimensions retrieval', () => {
    it('should get image dimensions', async () => {
      const dimensions = await ImageProcessor.getImageDimensions(
        'file:///test.jpg',
      );

      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
    });
  });

  describe('Base64 conversion', () => {
    it('should convert image to base64', async () => {
      const base64 = await ImageProcessor.convertToBase64('file:///test.jpg');

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
    });
  });

  describe('Image validation', () => {
    it('should validate quality parameter', async () => {
      await expect(
        ImageProcessor.compressImage('file:///test.jpg', 1.5),
      ).rejects.toThrow('Quality must be between 0 and 1');

      await expect(
        ImageProcessor.compressImage('file:///test.jpg', -0.1),
      ).rejects.toThrow('Quality must be between 0 and 1');
    });
  });
});
