/**
 * Image utility functions for file validation, processing, and URL handling
 */

// Supported image types
export const SUPPORTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
} as const;

// Max file size (5MB for MVP)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validate if a file is a supported image type
 */
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!Object.keys(SUPPORTED_IMAGE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: JPG, PNG, GIF, WebP, SVG`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
    return {
      valid: false,
      error: `File too large: ${sizeMB}MB. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique filename for S3 storage
 */
export function generateUniqueFileName(originalName: string, prefix?: string): string {
  const uuid = crypto.randomUUID();
  const extension = getFileExtension(originalName);
  const baseName = prefix ? `${prefix}-${uuid}` : uuid;

  return `${baseName}${extension}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot);
}

/**
 * Generate S3 path for a user's image
 * @param identityId - Cognito Identity ID for secure access
 * @param filename - The filename
 * @param isPublic - Whether this should be publicly accessible (for published content)
 */
export function generateS3Path(identityId: string, filename: string, isPublic: boolean = false): string {
  if (isPublic) {
    // Public path for published one-pager images (anyone can read)
    return `public/shared/${filename}`;
  } else {
    // Private path for draft/personal images (only owner can access)
    return `private/${identityId}/${filename}`;
  }
}

/**
 * Extract S3 key from a full S3 URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    // Handle both CloudFront and direct S3 URLs
    const patterns = [
      // CloudFront URL: https://d123.cloudfront.net/public/media/user123/file.jpg
      /https:\/\/[^\/]+\.cloudfront\.net\/(.+)/,
      // Direct S3 URL: https://bucket.s3.region.amazonaws.com/public/media/user123/file.jpg
      /https:\/\/[^\/]+\.s3[^\/]*\.amazonaws\.com\/(.+)/,
      // S3 website URL: https://bucket.s3-website-region.amazonaws.com/public/media/user123/file.jpg
      /https:\/\/[^\/]+\.s3-website[^\/]*\.amazonaws\.com\/(.+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}

/**
 * Check if a URL is an S3 URL
 */
export function isS3Url(url: string): boolean {
  return extractS3KeyFromUrl(url) !== null;
}

/**
 * Check if a URL is a blob URL (temporary image)
 */
export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Extract temp image ID from blob URL
 */
export function extractTempImageIdFromBlobUrl(blobUrl: string): string | null {
  // Our blob URLs are created with URL.createObjectURL() and contain a UUID at the end
  // Format: blob:http://localhost:3000/uuid-here
  const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i;
  const match = blobUrl.match(uuidRegex);
  return match ? match[1] : null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Create a preview-ready object URL from a File
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Extract all image URLs from content blocks (both S3 and blob URLs)
 */
export function extractImageUrls(contentBlocks: any[]): string[] {
  const urls: string[] = [];
  const jsonString = JSON.stringify(contentBlocks);

  // Find S3 URLs
  const s3UrlRegex = /https:\/\/[^"]*\.(?:s3[^"]*\.amazonaws\.com|cloudfront\.net)\/[^"]+/g;
  const s3Matches = jsonString.match(s3UrlRegex) || [];
  urls.push(...s3Matches);

  // Find blob URLs
  const blobUrlRegex = /blob:[^"]+/g;
  const blobMatches = jsonString.match(blobUrlRegex) || [];
  urls.push(...blobMatches);

  // Remove duplicates
  return Array.from(new Set(urls));
}

/**
 * Replace URLs in content blocks (used during migration)
 */
export function replaceUrlsInContentBlocks(contentBlocks: any[], urlMapping: Map<string, string>): any[] {
  let jsonString = JSON.stringify(contentBlocks);

  // Replace each URL with its mapped value
  urlMapping.forEach((newUrl, oldUrl) => {
    jsonString = jsonString.replace(new RegExp(escapeRegExp(oldUrl), 'g'), newUrl);
  });

  return JSON.parse(jsonString);
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
