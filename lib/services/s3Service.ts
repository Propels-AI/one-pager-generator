import { uploadData, UploadDataOutput } from 'aws-amplify/storage';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { DraftImage } from './draftImageStorage';
import { generateUniqueFileName, generateS3Path } from '@/lib/utils/imageUtils';

// Upload progress callback type
export interface UploadProgress {
  transferredBytes: number;
  totalBytes: number;
  percentage: number;
}

// Upload result type
export interface UploadResult {
  s3Url: string;
  s3Key: string;
  size: number;
  contentType: string;
}

// Upload options
export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  generateFileName?: boolean; // Whether to generate new filename or keep original
  filePrefix?: string; // Optional prefix for generated filename (e.g., 'team', 'testimonial')
}

/**
 * Service for uploading draft images to S3 using Amplify Storage
 */
export class S3UploadService {
  private static instance: S3UploadService;

  static getInstance(): S3UploadService {
    if (!S3UploadService.instance) {
      S3UploadService.instance = new S3UploadService();
    }
    return S3UploadService.instance;
  }

  /**
   * Get secure Cognito Identity ID for path generation
   * This ensures only the identity owner can write to their folder
   */
  private async getSecureIdentityId(): Promise<string> {
    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;

      if (!identityId) {
        throw new Error('No identity ID found - user may not be authenticated');
      }

      return identityId;
    } catch (error) {
      console.error('Failed to get identity ID:', error);
      throw new Error('Unable to get secure identity for upload');
    }
  }

  /**
   * Upload a draft image to S3
   */
  async uploadDraftImage(draftImage: DraftImage, options?: UploadOptions): Promise<UploadResult> {
    try {
      // Get secure identity ID (not user ID for security)
      const identityId = await this.getSecureIdentityId();

      // Generate filename
      const fileName =
        options?.generateFileName !== false
          ? generateUniqueFileName(draftImage.originalFileName, options?.filePrefix)
          : draftImage.originalFileName;

      // Generate S3 path - private for drafts, public when published
      const isPublic = Boolean(draftImage.onePagerId && draftImage.onePagerId !== 'new-document');
      const s3Key = generateS3Path(identityId, fileName, isPublic);

      // Prepare upload
      const uploadTask = uploadData({
        path: s3Key,
        data: draftImage.file,
        options: {
          contentType: draftImage.mimeType,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes && options?.onProgress) {
              const percentage = Math.round((transferredBytes / totalBytes) * 100);
              options.onProgress({
                transferredBytes,
                totalBytes,
                percentage,
              });
            }
          },
          // Add metadata for tracking
          metadata: {
            originalFileName: draftImage.originalFileName,
            uploadedAt: new Date().toISOString(),
            draftImageId: draftImage.id,
            blockType: draftImage.blockType || '',
            onePagerId: draftImage.onePagerId || '',
          },
        },
      });

      // Execute upload
      const result = await uploadTask.result;

      // Construct S3 URL from the result
      // Amplify returns the path, we need to construct the full URL
      const s3Url = await this.getS3UrlFromPath(result.path);

      return {
        s3Url,
        s3Key: result.path,
        size: draftImage.fileSize,
        contentType: draftImage.mimeType,
      };
    } catch (error) {
      const uploadError = new Error(`S3 upload failed: ${error}`);
      options?.onError?.(uploadError);
      throw uploadError;
    }
  }

  /**
   * Upload multiple draft images in parallel
   */
  async uploadMultipleDraftImages(
    draftImages: DraftImage[],
    options?: UploadOptions & {
      onImageUploaded?: (result: UploadResult, index: number) => void;
    }
  ): Promise<UploadResult[]> {
    const uploadPromises = draftImages.map(async (draftImage, index) => {
      try {
        const result = await this.uploadDraftImage(draftImage, {
          ...options,
          onProgress: (progress) => {
            // Include index in progress for multi-upload tracking
            options?.onProgress?.({
              ...progress,
              transferredBytes: progress.transferredBytes + index * 100, // Simple multi-file progress
              totalBytes: progress.totalBytes * draftImages.length,
            });
          },
        });

        options?.onImageUploaded?.(result, index);
        return result;
      } catch (error) {
        throw new Error(`Failed to upload image ${index + 1}: ${error}`);
      }
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Upload file directly (without draft storage)
   */
  async uploadFile(file: File, options?: UploadOptions): Promise<UploadResult> {
    try {
      // Get secure identity ID for path construction
      const identityId = await this.getSecureIdentityId();

      // Generate filename
      const fileName =
        options?.generateFileName !== false ? generateUniqueFileName(file.name, options?.filePrefix) : file.name;

      // Generate S3 path - default to private for direct uploads
      const isPublic = options?.filePrefix === 'published' || false;
      const s3Key = generateS3Path(identityId, fileName, isPublic);

      // Prepare upload
      const uploadTask = uploadData({
        path: s3Key,
        data: file,
        options: {
          contentType: file.type,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes && options?.onProgress) {
              const percentage = Math.round((transferredBytes / totalBytes) * 100);
              options.onProgress({
                transferredBytes,
                totalBytes,
                percentage,
              });
            }
          },
          metadata: {
            originalFileName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Execute upload
      const result = await uploadTask.result;

      // Get S3 URL
      const s3Url = await this.getS3UrlFromPath(result.path);

      return {
        s3Url,
        s3Key: result.path,
        size: file.size,
        contentType: file.type,
      };
    } catch (error) {
      const uploadError = new Error(`S3 upload failed: ${error}`);
      options?.onError?.(uploadError);
      throw uploadError;
    }
  }

  /**
   * Get public S3 URL from path using Amplify getUrl API
   */
  private async getS3UrlFromPath(path: string): Promise<string> {
    try {
      // For public files, we need to use Amplify's getUrl to get the signed URL
      // Import getUrl from aws-amplify/storage (not /server since this runs in browser)
      const { getUrl } = await import('aws-amplify/storage');

      const urlResult = await getUrl({
        path: path,
        options: {
          // For public files, we don't need validateObjectExistence for performance
          validateObjectExistence: false,
          // Set a longer expiration since these are public files
          expiresIn: 3600, // 1 hour
        },
      });

      return urlResult.url.toString();
    } catch (error) {
      console.error('Error getting S3 URL from path:', error);
      // Fallback: return the path itself (might work for direct public access)
      return path;
    }
  }

  /**
   * Retry upload with exponential backoff
   */
  async uploadWithRetry(
    draftImage: DraftImage,
    maxRetries: number = 3,
    options?: UploadOptions
  ): Promise<UploadResult> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadDraftImage(draftImage, options);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw new Error(`Upload failed after ${maxRetries + 1} attempts: ${lastError.message}`);
        }

        // Exponential backoff: wait 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        console.warn(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      }
    }

    throw lastError!;
  }
}

// Export singleton instance
export const s3Service = S3UploadService.getInstance();
