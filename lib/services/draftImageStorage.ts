import Dexie, { type EntityTable } from 'dexie';

// Interface for draft image storage
export interface DraftImage {
  id: string; // UUID for the draft image
  file: File; // The actual file blob
  previewUrl: string; // blob: URL for preview display
  originalFileName: string; // Original file name
  fileSize: number; // File size in bytes
  mimeType: string; // image/jpeg, image/png, etc.
  uploadedAt: Date; // When stored in IndexedDB
  onePagerId?: string; // Optional: associate with specific OnePager
  blockType?: string; // Optional: team, testimonial, etc.
}

// Database schema
const db = new Dexie('OnePagerDraftImages') as Dexie & {
  draftImages: EntityTable<DraftImage, 'id'>;
};

// Define schema
db.version(1).stores({
  draftImages: 'id, uploadedAt, onePagerId, blockType, mimeType',
});

// Draft image storage service
export class DraftImageStorage {
  private static instance: DraftImageStorage;

  static getInstance(): DraftImageStorage {
    if (!DraftImageStorage.instance) {
      DraftImageStorage.instance = new DraftImageStorage();
    }
    return DraftImageStorage.instance;
  }

  /**
   * Store a file temporarily in IndexedDB during draft creation
   */
  async storeImage(file: File, metadata?: { onePagerId?: string; blockType?: string }): Promise<DraftImage> {
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    const draftImage: DraftImage = {
      id,
      file,
      previewUrl,
      originalFileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      onePagerId: metadata?.onePagerId,
      blockType: metadata?.blockType,
    };

    await db.draftImages.add(draftImage);
    return draftImage;
  }

  /**
   * Get a draft image by ID
   */
  async getImage(id: string): Promise<DraftImage | undefined> {
    return await db.draftImages.get(id);
  }

  /**
   * List all draft images
   */
  async listImages(filter?: { onePagerId?: string; blockType?: string }): Promise<DraftImage[]> {
    let query = db.draftImages.orderBy('uploadedAt');

    if (filter?.onePagerId) {
      query = query.filter((img) => img.onePagerId === filter.onePagerId);
    }

    if (filter?.blockType) {
      query = query.filter((img) => img.blockType === filter.blockType);
    }

    return await query.reverse().toArray(); // Most recent first
  }

  /**
   * Delete a draft image
   */
  async deleteImage(id: string): Promise<void> {
    const image = await this.getImage(id);
    if (image) {
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(image.previewUrl);
      await db.draftImages.delete(id);
    }
  }

  /**
   * Delete multiple images by IDs
   */
  async deleteImages(ids: string[]): Promise<void> {
    const images = await db.draftImages.where('id').anyOf(ids).toArray();

    // Revoke all blob URLs
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));

    // Delete from IndexedDB
    await db.draftImages.where('id').anyOf(ids).delete();
  }

  /**
   * Clean up old draft images (older than 24 hours)
   */
  async cleanupOldImages(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldImages = await db.draftImages.where('uploadedAt').below(oneDayAgo).toArray();

    if (oldImages.length > 0) {
      // Revoke blob URLs
      oldImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));

      // Delete from IndexedDB
      await db.draftImages.where('uploadedAt').below(oneDayAgo).delete();
    }

    return oldImages.length;
  }

  /**
   * Get total storage usage (in bytes)
   */
  async getStorageUsage(): Promise<{ totalSize: number; imageCount: number }> {
    const images = await db.draftImages.toArray();
    const totalSize = images.reduce((sum, img) => sum + img.fileSize, 0);

    return {
      totalSize,
      imageCount: images.length,
    };
  }

  /**
   * Check if an image ID is a draft image
   */
  isDraftImageId(id: string): boolean {
    // Draft images use UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Extract draft image IDs from content blocks
   */
  extractDraftImageIds(contentBlocks: any[]): string[] {
    const draftIds: string[] = [];
    const jsonString = JSON.stringify(contentBlocks);

    // Look for blob URLs that contain our draft image IDs
    const blobUrlRegex = /blob:[^"]*\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/gi;
    let match;

    while ((match = blobUrlRegex.exec(jsonString)) !== null) {
      if (match[1]) {
        draftIds.push(match[1]);
      }
    }

    return Array.from(new Set(draftIds)); // Remove duplicates
  }
}

// Export singleton instance
export const draftImageStorage = DraftImageStorage.getInstance();

// Auto-cleanup on page load (run once)
if (typeof window !== 'undefined') {
  draftImageStorage.cleanupOldImages().catch(console.error);
}
