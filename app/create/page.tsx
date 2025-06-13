'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Loader2, Eye, Edit3 } from 'lucide-react';
import { AuthSignInDialog } from '@/components/ui/AuthSignInDialog';
import dynamic from 'next/dynamic';
import type { CustomSchemaEditor as BlockNoteEditorType, PartialBlock } from '@/components/editor/BlockNoteEditor';
import { customSchema } from '@/components/editor/BlockNoteEditor';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const BlockNoteEditor = dynamic(() => import('@/components/editor/BlockNoteEditor'), {
  ssr: false,
  loading: () => (
    <div className="p-4 border rounded-md min-h-[calc(100vh-120px)] flex items-center justify-center text-muted-foreground bg-white dark:bg-gray-900">
      Loading Editor...
    </div>
  ),
});

const Preview = dynamic(() => import('@/components/preview').then((mod) => mod.Preview), {
  ssr: false,
  loading: () => (
    <div className="p-4 border rounded-md min-h-[calc(100vh-10rem)] flex items-center justify-center text-muted-foreground">
      Loading Preview...
    </div>
  ),
});

const client = generateClient<Schema>();

export default function CreateOnePagerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [editorInstance, setEditorInstance] = useState<BlockNoteEditorType | null>(null);
  const [editorContent, setEditorContent] = useState<PartialBlock<typeof customSchema.blockSchema>[] | undefined>(
    undefined
  );
  const [internalTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [saveAttemptedBeforeAuth, setSaveAttemptedBeforeAuth] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  const executeSave = async () => {
    const finalInternalTitle = internalTitle.trim() || 'Untitled One-Pager';
    if (!editorInstance || !user) {
      alert('Title is missing or user session is invalid. Please try again.');
      setIsSaving(false);
      return;
    }

    const cognitoUserId = user.userId;
    const userPK = `USER#${cognitoUserId}`;
    const onePagerUUID = uuidv4();
    const currentDateTime = new Date();
    const currentStatus = 'DRAFT';
    const statusUpdatedAtISO = currentDateTime.toISOString();

    const appItemData = {
      PK: `ONEPAGER#${onePagerUUID}`,
      SK: 'METADATA', // Main item for the OnePager
      entityType: 'OnePager',
      ownerUserId: userPK, // Link to the UserProfile item's PK
      internalTitle: finalInternalTitle,
      status: currentStatus,
      statusUpdatedAt: statusUpdatedAtISO,
      templateId: 'default', // Or from a selector
      contentBlocks: JSON.stringify(editorInstance.document || []),
      gsi1PK: userPK, // For querying by owner
      gsi1SK: `${currentStatus}#${statusUpdatedAtISO}`, // For sorting by status and date
    };

    try {
      const result = await client.models.Entity.create(appItemData as any); // Using 'as any' for now if type conflicts arise with optional fields
      console.log('Entity (OnePager) saved:', result);
      if (result.data) {
        router.push(`/edit/${onePagerUUID}`); 
      } else if (result.errors) {
        console.error('Error saving Entity (OnePager):', result.errors);
        alert(`Failed to save: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }
    } catch (e: any) {
      console.error('Unexpected error creating OnePager:', e);
      alert('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!editorInstance) {
      alert('Editor not available.');
      return;
    }

    if (user) {
      executeSave();
    } else {
      // User is not logged in, show auth dialog
      setSaveAttemptedBeforeAuth(true);
      setIsAuthDialogOpen(true);
    }
  };

  useEffect(() => {
    if (user && saveAttemptedBeforeAuth && !isAuthDialogOpen) {
      if (editorInstance) {
        console.log('User signed in after save attempt, auto-triggering save...');
        executeSave();
      } else {
        console.log('Auto-save conditions met, but editor missing. User may need to click save again.');
      }
      setSaveAttemptedBeforeAuth(false);
    }
  }, [user, saveAttemptedBeforeAuth, isAuthDialogOpen, editorInstance, executeSave]);

  const handleEditorReady = useCallback((editor: BlockNoteEditorType) => {
    setEditorInstance(editor);
    setEditorContent(editor.document); // Set initial content for preview
    // Subscribe to content changes for live preview
    editor.onChange(() => {
      setEditorContent(editor.document);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mr-auto flex items-center">
            <h1 className="font-semibold text-lg">
              Create One-Pager ({viewMode === 'editor' ? 'Editing' : 'Previewing'})
            </h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              onClick={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
              variant="outline"
              size="icon"
              aria-label={viewMode === 'editor' ? 'Show Preview' : 'Show Editor'}
            >
              {viewMode === 'editor' ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editorInstance} variant="default">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : user ? (
                'Save One-Pager'
              ) : (
                'Sign in to Save'
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 pt-8 pb-4 max-w-screen-xl">
        <div className="flex flex-col gap-6">
          {viewMode === 'editor' && (
            // Editor Column
            <div className="w-full">
              <div className="rounded-lg min-h-[calc(100vh-120px)] bg-white dark:bg-gray-950 overflow-hidden">
                <BlockNoteEditor onEditorReady={handleEditorReady} initialContent={editorContent} />
              </div>
            </div>
          )}

          {viewMode === 'preview' && (
            // Preview Column
            <div className="w-full h-full md:max-h-[calc(100vh-theme(spacing.14)-4rem)] overflow-y-auto">
              <div className="p-6 bg-white dark:bg-gray-950 rounded-lg min-h-[calc(100vh-120px)] md:min-h-0">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b pb-2">
                  Live Preview
                </h2>
                {(editorInstance || editorContent) && customSchema ? (
                  <Preview content={editorContent} />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    Editor content will appear here.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      {isAuthDialogOpen && (
        <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
          <DialogContent className="sm:max-w-[425px] md:max-w-[550px] lg:max-w-[700px] p-0 overflow-y-auto max-h-[90vh]">
            <AuthSignInDialog />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
