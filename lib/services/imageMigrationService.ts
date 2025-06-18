import { getCurrentUser } from 'aws-amplify/auth';
import { draftImageStorage, type DraftImage } from './draftImageStorage';
import { s3Service, type UploadResult, type UploadProgress } from './s3Service';
import {
  extractImageUrls,
  replaceUrlsInContentBlocks,
  isBlobUrl,
  isS3Url,
  extractTempImageIdFromBlobUrl,
  extractS3KeyFromUrl,
  generateUniqueFileName,
  generateS3Path,
} from '@/lib/utils/imageUtils';

// Migration result for a single image
export interface ImageMigrationResult {
  originalUrl: string;
  s3Url: string;
  s3Key: string;
  uploadResult: UploadResult;
  error?: string;
}

// Migration options
export interface MigrationOptions {
  onProgress?: (progress: MigrationProgress) => void;
  onImageMigrated?: (result: ImageMigrationResult) => void;
  generateFileName?: boolean;
  filePrefix?: string;
  cleanupDrafts?: boolean; // Whether to remove draft images after successful migration
}

// Overall migration progress
export interface MigrationProgress {
  totalImages: number;
  migratedImages: number;
  currentImageName?: string;
  uploadProgress?: UploadProgress;
  percentage: number;
}

/**
 * Service for migrating draft images to S3 during save/publish operations
 */
export class ImageMigrationService {
  private static instance: ImageMigrationService;

  static getInstance(): ImageMigrationService {
    if (!ImageMigrationService.instance) {
      ImageMigrationService.instance = new ImageMigrationService();
    }
    return ImageMigrationService.instance;
  }

  /**
   * Migrate content block images to S3
   * @param contentBlocks - The content blocks containing image URLs
   * @param onePagerId - The ID of the one-pager
   * @param options - Migration options including whether this is for publishing
   */
  async migrateContentBlockImages(
    contentBlocks: any[],
    onePagerId: string,
    options?: MigrationOptions & { isPublishing?: boolean }
  ): Promise<{ updatedContentBlocks: any[]; migrationResults: ImageMigrationResult[] }> {
    try {
      let currentContentBlocks = contentBlocks;
      let allMigrationResults: ImageMigrationResult[] = [];

      // Step 1: Handle blob URLs (draft images)
      const imageUrls = extractImageUrls(currentContentBlocks);
      const blobUrls = imageUrls.filter((url) => isBlobUrl(url));

      if (blobUrls.length > 0) {
        // Report initial progress
        options?.onProgress?.({
          totalImages: blobUrls.length,
          migratedImages: 0,
          percentage: 0,
        });

        // Set migration options based on publishing status
        const migrationOptions = {
          ...options,
          // If publishing, use 'published' prefix to trigger public path
          filePrefix: options?.isPublishing ? 'published' : options?.filePrefix,
        };

        // Migrate each blob URL to S3
        const blobMigrationResults = await this.migrateBlobUrls(blobUrls, onePagerId, migrationOptions);
        allMigrationResults.push(...blobMigrationResults);

        // Create URL mapping for replacement
        const urlMapping = new Map<string, string>();
        blobMigrationResults.forEach((result) => {
          // Include both successful migrations and "soft errors" where we keep the original URL
          if (!result.error || result.error === 'Draft image not found - keeping original URL') {
            urlMapping.set(result.originalUrl, result.s3Url);
          }
        });

        // Replace blob URLs with S3 URLs in content blocks
        currentContentBlocks = replaceUrlsInContentBlocks(currentContentBlocks, urlMapping);
      }

      // Step 2: Handle private-to-public migration when publishing
      if (options?.isPublishing) {
        const privateToPublicResult = await this.migratePrivateToPublicImages(
          currentContentBlocks,
          onePagerId,
          options
        );
        currentContentBlocks = privateToPublicResult.updatedContentBlocks;
        allMigrationResults.push(...privateToPublicResult.migrationResults);
      }

      // Clean up draft images if requested
      if (options?.cleanupDrafts) {
        await this.cleanupMigratedDraftImages(allMigrationResults);
      }

      return {
        updatedContentBlocks: currentContentBlocks,
        migrationResults: allMigrationResults,
      };
    } catch (error) {
      console.error('❌ Content block image migration failed:', error);
      throw new Error(`Migration failed: ${error}`);
    }
  }

  // Migrate multiple blob URLs to S3
  private async migrateBlobUrls(
    blobUrls: string[],
    onePagerId: string,
    options?: MigrationOptions
  ): Promise<ImageMigrationResult[]> {
    const results: ImageMigrationResult[] = [];

    for (let i = 0; i < blobUrls.length; i++) {
      const blobUrl = blobUrls[i];

      try {
        // Update progress for current image
        options?.onProgress?.({
          totalImages: blobUrls.length,
          migratedImages: i,
          currentImageName: `Image ${i + 1}`,
          percentage: (i / blobUrls.length) * 100,
        });

        const result = await this.migrateBlobUrl(blobUrl, onePagerId, options);

        results.push(result);

        // Only call onImageMigrated for successful migrations
        if (!result.error) {
          options?.onImageMigrated?.(result);
        }
      } catch (error) {
        const failedResult: ImageMigrationResult = {
          originalUrl: blobUrl,
          s3Url: blobUrl, // Keep original URL as fallback
          s3Key: '',
          uploadResult: {} as UploadResult,
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        results.push(failedResult);
        console.error(`Failed to migrate image ${blobUrl}:`, error);
      }
    }

    // Final progress update
    options?.onProgress?.({
      totalImages: blobUrls.length,
      migratedImages: blobUrls.length,
      percentage: 100,
    });

    return results;
  }

  // Migrate a single blob URL to S3
  private async migrateBlobUrl(
    blobUrl: string,
    onePagerId: string,
    options?: MigrationOptions
  ): Promise<ImageMigrationResult> {
    try {
      // Find draft image by matching the blob URL (previewUrl)
      const allDraftImages = await draftImageStorage.listImages();
      const draftImage = allDraftImages.find((img) => img.previewUrl === blobUrl);

      if (!draftImage) {
        // Handle orphaned blob URLs gracefully - return a result that keeps the original URL
        return {
          originalUrl: blobUrl,
          s3Url: blobUrl, // Keep the blob URL as-is since we can't migrate it
          s3Key: '',
          uploadResult: {} as UploadResult,
          error: 'Draft image not found - keeping original URL',
        };
      }

      // Update draft image with one-pager context
      const updatedDraftImage: DraftImage = {
        ...draftImage,
        onePagerId,
        // Set blockType if provided via file prefix
        blockType: options?.filePrefix || draftImage.blockType,
      };

      // Upload to S3 (without migration progress callback to avoid type conflicts)
      const uploadResult = await s3Service.uploadDraftImage(updatedDraftImage, {
        generateFileName: options?.generateFileName,
        filePrefix: options?.filePrefix,
        onError: (error) => {
          console.error('S3 upload error:', error);
        },
      });

      return {
        originalUrl: blobUrl,
        s3Url: uploadResult.s3Url,
        s3Key: uploadResult.s3Key,
        uploadResult,
      };
    } catch (error) {
      throw new Error(`Failed to migrate blob URL ${blobUrl}: ${error}`);
    }
  }

  // Migrate draft images for a specific block type
  // Useful when saving individual blocks
  async migrateBlockImages(
    imageUrls: string[],
    blockType: string,
    onePagerId: string,
    options?: MigrationOptions
  ): Promise<{ urlMapping: Map<string, string>; migrationResults: ImageMigrationResult[] }> {
    const blobUrls = imageUrls.filter((url) => isBlobUrl(url));

    if (blobUrls.length === 0) {
      return {
        urlMapping: new Map(),
        migrationResults: [],
      };
    }

    const migrationOptions = {
      ...options,
      filePrefix: blockType,
      generateFileName: true,
    };

    const migrationResults = await this.migrateBlobUrls(blobUrls, onePagerId, migrationOptions);

    // Create URL mapping
    const urlMapping = new Map<string, string>();
    migrationResults.forEach((result) => {
      if (!result.error) {
        urlMapping.set(result.originalUrl, result.s3Url);
      }
    });

    return {
      urlMapping,
      migrationResults,
    };
  }

  // Check if content blocks contain draft images that need migration
  hasUnmigratedImages(contentBlocks: any[]): boolean {
    const imageUrls = extractImageUrls(contentBlocks);
    return imageUrls.some((url) => isBlobUrl(url));
  }

  // Get count of unmigrated draft images
  getUnmigratedImageCount(contentBlocks: any[]): number {
    const imageUrls = extractImageUrls(contentBlocks);
    return imageUrls.filter((url) => isBlobUrl(url)).length;
  }

  // Clean up draft images after successful migration
  private async cleanupMigratedDraftImages(migrationResults: ImageMigrationResult[]): Promise<void> {
    const cleanupPromises = migrationResults
      .filter((result) => !result.error && result.s3Key) // Only clean up successfully migrated images with S3 keys
      .map(async (result) => {
        try {
          const draftImageId = extractTempImageIdFromBlobUrl(result.originalUrl);
          if (draftImageId) {
            await draftImageStorage.deleteImage(draftImageId);
          }
        } catch (error) {
          console.warn(`Failed to cleanup draft image ${result.originalUrl}:`, error);
        }
      });

    await Promise.all(cleanupPromises);
  }

  // Rollback S3 uploads if save operation fails
  // This helps prevent orphaned files in S3
  async rollbackMigration(migrationResults: ImageMigrationResult[]): Promise<void> {
    const { remove } = await import('aws-amplify/storage');

    const rollbackPromises = migrationResults
      .filter((result) => !result.error && result.s3Key) // Only rollback successful uploads
      .map(async (result) => {
        try {
          await remove({ path: result.s3Key });
        } catch (error) {
          console.warn(`Failed to rollback S3 file ${result.s3Key}:`, error);
        }
      });

    await Promise.all(rollbackPromises);
  }

  // Preview migration - check what would be migrated without actually doing it
  async previewMigration(contentBlocks: any[]): Promise<{
    blobUrls: string[];
    draftImages: DraftImage[];
    totalSize: number;
  }> {
    const imageUrls = extractImageUrls(contentBlocks);
    const blobUrls = imageUrls.filter((url) => isBlobUrl(url));

    const draftImages: DraftImage[] = [];
    let totalSize = 0;

    for (const blobUrl of blobUrls) {
      const draftImageId = extractTempImageIdFromBlobUrl(blobUrl);
      if (draftImageId) {
        const draftImage = await draftImageStorage.getImage(draftImageId);
        if (draftImage) {
          draftImages.push(draftImage);
          totalSize += draftImage.fileSize;
        }
      }
    }

    return {
      blobUrls,
      draftImages,
      totalSize,
    };
  }

  // Migrate existing S3 images from private to public paths when publishing
  // This handles the case where a draft with S3 images is being published
  async migratePrivateToPublicImages(
    contentBlocks: any[],
    onePagerId: string,
    options?: MigrationOptions
  ): Promise<{ updatedContentBlocks: any[]; migrationResults: ImageMigrationResult[] }> {
    try {
      const imageUrls = extractImageUrls(contentBlocks);
      const s3Urls = imageUrls.filter((url) => isS3Url(url));

      // For each S3 URL, we need to check if it's actually pointing to a private path
      // Since signed URLs don't contain the path structure, we'll try to extract the S3 key
      const potentialPrivateUrls: string[] = [];

      for (const url of s3Urls) {
        const s3Key = extractS3KeyFromUrl(url);

        if (s3Key && s3Key.startsWith('private/')) {
          potentialPrivateUrls.push(url);
        }
      }

      if (potentialPrivateUrls.length === 0) {
        return {
          updatedContentBlocks: contentBlocks,
          migrationResults: [],
        };
      }

      const migrationResults: ImageMigrationResult[] = [];
      const urlMapping = new Map<string, string>();

      // Import necessary storage functions
      const { downloadData, uploadData } = await import('aws-amplify/storage');
      const { generateUniqueFileName, generateS3Path } = await import('@/lib/utils/imageUtils');

      for (const privateUrl of potentialPrivateUrls) {
        try {
          // Extract the private S3 key from the URL
          const privateKey = extractS3KeyFromUrl(privateUrl);
          if (!privateKey || !privateKey.startsWith('private/')) {
            continue;
          }

          // Download the file from private location
          const downloadResult = await downloadData({ path: privateKey }).result;
          const fileBlob = await downloadResult.body.blob();

          // Generate new public path
          const identityId = privateKey.split('/')[1]; // Extract identity ID from path
          const originalFilename = privateKey.split('/').pop() || 'image';
          const newFilename = generateUniqueFileName(originalFilename, 'published');
          const publicKey = generateS3Path(identityId, newFilename, true);

          // Upload to public location
          const uploadResult = await uploadData({
            path: publicKey,
            data: fileBlob,
            options: {
              contentType: downloadResult.contentType,
            },
          }).result;

          // Generate public URL
          const publicUrl = await this.getS3UrlFromPath(uploadResult.path);

          urlMapping.set(privateUrl, publicUrl);
          migrationResults.push({
            originalUrl: privateUrl,
            s3Url: publicUrl,
            s3Key: uploadResult.path,
            uploadResult: {
              s3Url: publicUrl,
              s3Key: uploadResult.path,
              size: fileBlob.size,
              contentType: downloadResult.contentType || 'image/jpeg',
            },
          });
        } catch (error) {
          migrationResults.push({
            originalUrl: privateUrl,
            s3Url: privateUrl, // Keep original as fallback
            s3Key: '',
            uploadResult: {} as UploadResult,
            error: `Migration failed: ${error}`,
          });
        }
      }

      // Replace URLs in content blocks
      const updatedContentBlocks = replaceUrlsInContentBlocks(contentBlocks, urlMapping);

      return {
        updatedContentBlocks,
        migrationResults,
      };
    } catch (error) {
      throw new Error(`Private to public migration failed: ${error}`);
    }
  }

  // Helper method to get S3 URL from path (extracted for reuse)
  private async getS3UrlFromPath(path: string): Promise<string> {
    try {
      const { getUrl } = await import('aws-amplify/storage');

      const urlResult = await getUrl({
        path: path,
        options: {
          validateObjectExistence: false,
          expiresIn: 3600,
        },
      });

      return urlResult.url.toString();
    } catch (error) {
      console.error('Error getting S3 URL from path:', error);
      return path; // Fallback
    }
  }
}

// Export singleton instance
export const imageMigrationService = ImageMigrationService.getInstance();
