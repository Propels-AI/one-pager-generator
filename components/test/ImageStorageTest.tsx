'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { draftImageStorage, type DraftImage } from '@/lib/services/draftImageStorage';
import { isValidImageFile, formatFileSize } from '@/lib/utils/imageUtils';

export function ImageStorageTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storedImages, setStoredImages] = useState<DraftImage[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ totalSize: number; imageCount: number } | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = isValidImageFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setStatus(`✅ Valid file: ${file.name} (${formatFileSize(file.size)})`);
      } else {
        setStatus(`❌ ${validation.error}`);
        setSelectedFile(null);
      }
    }
  };

  const handleStoreImage = async () => {
    if (!selectedFile) return;

    try {
      setStatus('📁 Storing image...');
      const draftImage = await draftImageStorage.storeImage(selectedFile, {
        blockType: 'test',
        onePagerId: 'test-onepager',
      });

      setStatus(`✅ Image stored! ID: ${draftImage.id.substring(0, 8)}...`);
      setSelectedFile(null);

      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh lists
      await refreshData();
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await draftImageStorage.deleteImage(id);
      setStatus(`🗑️ Deleted image ${id.substring(0, 8)}...`);
      await refreshData();
    } catch (error) {
      setStatus(`❌ Delete error: ${error}`);
    }
  };

  const handleCleanup = async () => {
    try {
      const deleted = await draftImageStorage.cleanupOldImages();
      setStatus(`🧹 Cleaned up ${deleted} old images`);
      await refreshData();
    } catch (error) {
      setStatus(`❌ Cleanup error: ${error}`);
    }
  };

  const refreshData = async () => {
    try {
      const [images, info] = await Promise.all([draftImageStorage.listImages(), draftImageStorage.getStorageUsage()]);
      setStoredImages(images);
      setStorageInfo(info);
    } catch (error) {
      setStatus(`❌ Refresh error: ${error}`);
    }
  };

  // Load data on mount
  React.useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Draft Image Storage Test</h2>

      {/* File Upload Test */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Upload Test</h3>
        <Input type="file" accept="image/*" onChange={handleFileSelect} />
        {selectedFile && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">
              Ready: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </span>
            <Button onClick={handleStoreImage} size="sm">
              Store Image
            </Button>
          </div>
        )}
      </div>

      {/* Status */}
      {status && <div className="p-3 bg-gray-100 rounded text-sm font-mono">{status}</div>}

      {/* Storage Info */}
      {storageInfo && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Storage Usage</h3>
          <p>Images: {storageInfo.imageCount}</p>
          <p>Total Size: {formatFileSize(storageInfo.totalSize)}</p>
          <Button onClick={handleCleanup} variant="outline" size="sm" className="mt-2">
            Cleanup Old Images
          </Button>
        </div>
      )}

      {/* Stored Images */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Stored Images ({storedImages.length})</h3>
          <Button onClick={refreshData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {storedImages.length === 0 ? (
          <p className="text-gray-500 text-sm">No images stored</p>
        ) : (
          <div className="space-y-3">
            {storedImages.map((image) => (
              <div key={image.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                {/* Preview */}
                <img src={image.previewUrl} alt={image.originalFileName} className="w-16 h-16 object-cover rounded" />

                {/* Info */}
                <div className="flex-1 text-sm">
                  <p className="font-medium">{image.originalFileName}</p>
                  <p className="text-gray-600">
                    {formatFileSize(image.fileSize)} • {image.mimeType}
                  </p>
                  <p className="text-gray-500">
                    ID: {image.id.substring(0, 8)}... •{image.blockType && ` Block: ${image.blockType}`}
                  </p>
                </div>

                {/* Actions */}
                <Button onClick={() => handleDeleteImage(image.id)} variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
