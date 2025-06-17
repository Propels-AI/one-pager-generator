'use client';

import React, { useState } from 'react';
import ImageUpload from '@/components/ui/ImageUpload';
import { s3Service, type UploadResult, type UploadProgress } from '@/lib/services/s3Service';
import {
  imageMigrationService,
  type ImageMigrationResult,
  type MigrationProgress,
} from '@/lib/services/imageMigrationService';
import { draftImageStorage } from '@/lib/services/draftImageStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function S3UploadTest() {
  const [draftImageUrl, setDraftImageUrl] = useState<string>('');
  const [s3UploadResult, setS3UploadResult] = useState<UploadResult | null>(null);
  const [migrationResults, setMigrationResults] = useState<ImageMigrationResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleImageUpload = (imageUrl: string) => {
    setDraftImageUrl(imageUrl);
    addLog(`Image uploaded to draft storage: ${imageUrl.substring(0, 50)}...`);
  };

  const handleImageRemove = () => {
    setDraftImageUrl('');
    setS3UploadResult(null);
    addLog('Image removed from draft storage');
  };

  // Test direct S3 upload (simulating authenticated user)
  const testDirectS3Upload = async () => {
    if (!draftImageUrl) {
      addLog('No draft image to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);
    setS3UploadResult(null);

    try {
      addLog('Starting direct S3 upload...');

      // Get draft image from blob URL
      const draftImages = await draftImageStorage.listImages();
      const draftImage = draftImages.find((img: any) => img.previewUrl === draftImageUrl);

      if (!draftImage) {
        throw new Error('Draft image not found');
      }

      // Upload to S3
      const result = await s3Service.uploadDraftImage(draftImage, {
        filePrefix: 'test',
        generateFileName: true,
        onProgress: (progress) => {
          setUploadProgress(progress);
          addLog(`Upload progress: ${progress.percentage}%`);
        },
      });

      setS3UploadResult(result);
      addLog(`✅ Direct S3 upload successful! URL: ${result.s3Url.substring(0, 50)}...`);
    } catch (error) {
      addLog(`❌ Direct S3 upload failed: ${error}`);
      console.error('Direct S3 upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Test migration service (simulating save/publish operation)
  const testMigrationService = async () => {
    if (!draftImageUrl) {
      addLog('No draft image to migrate');
      return;
    }

    setIsMigrating(true);
    setMigrationProgress(null);
    setMigrationResults([]);

    try {
      addLog('Starting migration service test...');

      // Create mock content blocks with draft images
      const mockContentBlocks = [
        {
          type: 'team',
          data: {
            members: [
              { name: 'John Doe', avatar: draftImageUrl },
              { name: 'Jane Smith', avatar: 'https://example.com/existing.jpg' },
            ],
          },
        },
      ];

      const mockOnePagerId = 'test-one-pager-' + Date.now();

      // Run migration
      const { updatedContentBlocks, migrationResults } = await imageMigrationService.migrateContentBlockImages(
        mockContentBlocks,
        mockOnePagerId,
        {
          filePrefix: 'migration-test',
          generateFileName: true,
          cleanupDrafts: true,
          onProgress: (progress) => {
            setMigrationProgress(progress);
            addLog(`Migration progress: ${progress.percentage}% (${progress.migratedImages}/${progress.totalImages})`);
          },
          onImageMigrated: (result) => {
            addLog(`✅ Image migrated: ${result.originalUrl.substring(0, 30)}...`);
          },
        }
      );

      setMigrationResults(migrationResults);

      addLog(`✅ Migration completed! ${migrationResults.length} images processed`);

      // Check if draft image was cleaned up
      const remainingDrafts = await draftImageStorage.listImages();
      addLog(`Remaining draft images: ${remainingDrafts.length}`);
    } catch (error) {
      addLog(`❌ Migration failed: ${error}`);
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
      setMigrationProgress(null);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">S3 Upload & Migration Test</h1>

      {/* Image Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Upload Draft Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload value={draftImageUrl} onChange={handleImageUpload} className="max-w-md" />
          {draftImageUrl && (
            <div className="mt-2">
              <Badge variant="secondary">Draft Image Ready</Badge>
              <Button onClick={handleImageRemove} variant="outline" size="sm" className="ml-2">
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct S3 Upload Test */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2a: Test Direct S3 Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDirectS3Upload} disabled={!draftImageUrl || isUploading} className="w-full">
            {isUploading ? 'Uploading...' : 'Test Direct S3 Upload'}
          </Button>

          {uploadProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{uploadProgress.percentage}%</span>
              </div>
              <Progress value={uploadProgress.percentage} />
            </div>
          )}

          {s3UploadResult && (
            <div className="space-y-2">
              <Badge variant="default">✅ S3 Upload Success</Badge>
              <div className="text-sm">
                <div>S3 URL: {s3UploadResult.s3Url.substring(0, 60)}...</div>
                <div>Size: {Math.round(s3UploadResult.size / 1024)}KB</div>
                <div>Type: {s3UploadResult.contentType}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Service Test */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2b: Test Migration Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testMigrationService} disabled={!draftImageUrl || isMigrating} className="w-full">
            {isMigrating ? 'Migrating...' : 'Test Migration Service'}
          </Button>

          {migrationProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Migration Progress</span>
                <span>{migrationProgress.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={migrationProgress.percentage} />
              {migrationProgress.currentImageName && (
                <div className="text-sm text-gray-600">Processing: {migrationProgress.currentImageName}</div>
              )}
            </div>
          )}

          {migrationResults.length > 0 && (
            <div className="space-y-2">
              <Badge variant="default">✅ Migration Completed</Badge>
              <div className="space-y-1">
                {migrationResults.map((result, index) => (
                  <div key={index} className="text-sm p-2 border rounded">
                    {result.error ? (
                      <div className="text-red-600">❌ {result.error}</div>
                    ) : (
                      <div className="text-green-600">✅ {result.originalUrl.substring(0, 30)}... → S3</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Activity Logs</span>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No activity yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
