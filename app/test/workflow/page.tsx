'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateOnePager } from '@/lib/hooks/useOnePagerMutations';
import { getCurrentUser } from 'aws-amplify/auth';
import { toast } from 'sonner';

// Sample team block with draft image
const createSampleTeamBlock = (avatarUrl: string) => ({
  id: 'team-1',
  type: 'team',
  props: {
    mainHeading: 'Test Team',
    subHeading: 'Testing Image Upload',
    descriptionParagraph: 'This is a test of the image migration workflow.',
    teamMembers: JSON.stringify([
      {
        id: 'member-1',
        name: 'Test User',
        role: 'Tester',
        description: 'Testing the upload workflow',
        avatar: avatarUrl,
      },
    ]),
  },
  content: [],
});

export default function WorkflowTestPage() {
  const [testImageUrl, setTestImageUrl] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const createOnePager = useCreateOnePager();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a blob URL to simulate draft image storage
      const blobUrl = URL.createObjectURL(file);
      setTestImageUrl(blobUrl);
      toast.success('Draft image created', {
        description: 'Image stored locally. Now test save to trigger S3 migration.',
      });
    }
  };

  const testSaveWithMigration = async () => {
    if (!testImageUrl) {
      toast.error('Please upload an image first');
      return;
    }

    setIsCreating(true);

    try {
      const user = await getCurrentUser();

      // Create content blocks with the test image
      const contentBlocks = [createSampleTeamBlock(testImageUrl)];

      await createOnePager.mutateAsync({
        ownerUserId: user.userId,
        internalTitle: 'Image Migration Test',
        status: 'DRAFT',
        contentBlocks,
      });

      toast.success('Test complete!', {
        description: 'Check the editor to see if the image was migrated to S3.',
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Image Upload Workflow Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Step 1: Upload Test Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {testImageUrl && (
              <div className="mt-2">
                <img src={testImageUrl} alt="Test upload" className="w-24 h-24 object-cover rounded border" />
                <p className="text-sm text-green-600 mt-1">✓ Draft image ready</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Step 2: Test Save & Migration</h3>
            <Button onClick={testSaveWithMigration} disabled={!testImageUrl || isCreating} className="w-full">
              {isCreating ? 'Testing Migration...' : 'Save OnePager (Triggers Migration)'}
            </Button>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">What this test does:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Creates a blob URL for your uploaded image (simulates draft storage)</li>
              <li>Creates a OnePager with team block containing the blob URL</li>
              <li>Triggers save mutation which should migrate blob URL to S3</li>
              <li>Final OnePager should have S3 URLs instead of blob URLs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
