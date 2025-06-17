'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { draftImageStorage, type DraftImage } from '@/lib/services/draftImageStorage';
import { isValidImageFile, formatFileSize } from '@/lib/utils/imageUtils';

interface ImageUploadProps {
  value?: string; // Current image URL (S3 or blob URL)
  onChange?: (url: string) => void; // Called when image changes
  onError?: (error: string) => void; // Called on validation errors
  placeholder?: string;
  className?: string;
  metadata?: { onePagerId?: string; blockType?: string }; // For tracking
}

export default function ImageUpload({
  value,
  onChange,
  onError,
  placeholder = 'Upload an image or enter URL',
  className,
  metadata,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleError = (error: string) => {
    onError?.(error);
    // Auto-clear error after 5 seconds
    setTimeout(() => onError?.(''), 5000);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // Validate file
      const validation = isValidImageFile(file);
      if (!validation.valid) {
        handleError(validation.error!);
        return;
      }

      // Store in draft storage
      const draftImage = await draftImageStorage.storeImage(file, metadata);

      // Return the preview URL
      onChange?.(draftImage.previewUrl);
    } catch (error) {
      handleError(`Upload failed: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length > 0) {
        await handleFileUpload(fileArray[0]); // Only take first file
      }
    },
    [metadata, onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input value
      e.target.value = '';
    },
    [processFiles]
  );

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange?.(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange?.('');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Show preview if we have a value
  if (value) {
    return (
      <div className={cn('relative group', className)}>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <img src={value} alt="Uploaded image" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={openFileDialog} disabled={isUploading}>
              <Upload className="h-4 w-4 mr-1" />
              Replace
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>

        {/* Hidden file input for replace */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    );
  }

  // Show URL input mode
  if (showUrlInput) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit();
              } else if (e.key === 'Escape') {
                setShowUrlInput(false);
                setUrlInput('');
              }
            }}
          />
          <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
            Add
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput('');
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Show upload dropzone
  return (
    <div className={cn('w-full', className)}>
      <Card
        className={cn(
          'border-2 border-dashed transition-colors duration-200 cursor-pointer',
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? openFileDialog : undefined}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mb-3">
            <p className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Drop image here or click to browse'}</p>
            <p className="text-xs text-muted-foreground mt-1">Supports: JPG, PNG, GIF, WebP, SVG • Max 5MB</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" disabled={isUploading}>
              <ImageIcon className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Choose File'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlInput(true);
              }}
              disabled={isUploading}
            >
              <Link className="mr-2 h-4 w-4" />
              Use URL
            </Button>
          </div>
        </div>
      </Card>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
