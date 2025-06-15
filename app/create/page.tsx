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
import { nanoid } from 'nanoid';
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

  const [isSaving, setIsSaving] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [saveIntentAfterAuth, setSaveIntentAfterAuth] = useState<'draft' | 'publish' | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [currentSavingAction, setCurrentSavingAction] = useState<'draft' | 'publish' | null>(null);

  const executeSave = useCallback(
    async (isPublishing: boolean) => {
      setCurrentSavingAction(isPublishing ? 'publish' : 'draft');
      setIsSaving(true);
      const finalInternalTitle = 'Untitled One-Pager';
      if (!editorInstance || !user) {
        alert('Editor is not ready or user session is invalid. Please try again.');
        setIsSaving(false);
        return;
      }

      const cognitoUserId = user.userId;
      const userPK = `USER#${cognitoUserId}`;
      const onePagerUUID = uuidv4();
      const onePagerPK = `ONEPAGER#${onePagerUUID}`;
      const currentDateTime = new Date();
      const currentStatus = isPublishing ? 'PUBLISHED' : 'DRAFT';
      const statusUpdatedAtISO = currentDateTime.toISOString();

      const onePagerData = {
        PK: onePagerPK,
        SK: 'METADATA',
        entityType: 'OnePager',
        ownerUserId: userPK,
        internalTitle: finalInternalTitle,
        status: currentStatus,
        statusUpdatedAt: statusUpdatedAtISO,
        templateId: 'default',
        contentBlocks: JSON.stringify(editorInstance.document || []),
        gsi1PK: userPK,
        gsi1SK: `${currentStatus}#${statusUpdatedAtISO}`,
      };

      try {
        // Step 1: Create the OnePager item
        const onePagerResult = await client.models.Entity.create(onePagerData as any);
        if (onePagerResult.errors) {
          throw new Error(onePagerResult.errors.map((e: any) => e.message).join(', '));
        }
        console.log('Entity (OnePager) saved:', onePagerResult.data);

        // Step 2: Create the default SharedLink item, making it instantly public
        const sharedLinkSlug = nanoid(6); // Generate a 6-char slug
        const sharedLinkData = {
          PK: `SLINK#${sharedLinkSlug}`,
          SK: 'METADATA',
          entityType: 'SharedLink',
          baseOnePagerId: onePagerPK,
          ownerUserId: userPK,
          recipientNameForDisplay: 'Public Link',
          gsi2PK: onePagerPK,
          gsi2SK: statusUpdatedAtISO,
        };

        const sharedLinkResult = await client.models.Entity.create(sharedLinkData as any);
        if (sharedLinkResult.errors) {
          // In a real-world scenario, you might want to delete the OnePager item here (rollback)
          throw new Error(
            `OnePager was saved, but failed to create a share link: ${sharedLinkResult.errors.map((e: any) => e.message).join(', ')}`
          );
        }
        console.log('Entity (SharedLink) saved:', sharedLinkResult.data);

        // Step 3: Redirect to the new public page if publishing
        if (isPublishing) {
          router.push(`/edit/${onePagerUUID}`);
        } else {
          router.push(`/edit/${onePagerUUID}`);
          setIsSaving(false);
          setCurrentSavingAction(null);
        }
      } catch (e: any) {
        console.error(`Error saving OnePager (publishing: ${isPublishing}):`, e);
        alert(`An unexpected error occurred while saving: ${e.message}`);
        setIsSaving(false);
        setCurrentSavingAction(null);
      }
    },
    [editorInstance, user, router]
  ); // Added dependencies for useCallback

  const handleSaveDraft = () => {
    if (!editorInstance) {
      alert('Editor not available.');
      return;
    }
    if (user) {
      executeSave(false);
    } else {
      localStorage.setItem(
        'pendingCreateOnePager',
        JSON.stringify({
          pendingAction: 'create',
          contentBlocks: editorInstance.document,
          saveIntent: 'draft',
          returnTo: '/create',
        })
      );
      setSaveIntentAfterAuth('draft');
      setIsAuthDialogOpen(true);
    }
  };

  const handleSaveAndPublish = () => {
    if (!editorInstance) {
      alert('Editor not available.');
      return;
    }
    if (user) {
      executeSave(true);
    } else {
      localStorage.setItem(
        'pendingCreateOnePager',
        JSON.stringify({
          pendingAction: 'create',
          contentBlocks: editorInstance.document,
          saveIntent: 'publish',
          returnTo: '/create',
        })
      );
      setSaveIntentAfterAuth('publish');
      setIsAuthDialogOpen(true);
    }
  };

  useEffect(() => {
    if (user && saveIntentAfterAuth && !isAuthDialogOpen) {
      if (editorInstance) {
        console.log(`User signed in after '${saveIntentAfterAuth}' intent, auto-triggering...`);
        if (saveIntentAfterAuth === 'publish') {
          executeSave(true);
        } else if (saveIntentAfterAuth === 'draft') {
          executeSave(false);
        }
      } else {
        console.log('Auto-save conditions met, but editor missing. User may need to click save/publish again.');
      }
      setSaveIntentAfterAuth(null);
    }
  }, [user, saveIntentAfterAuth, isAuthDialogOpen, editorInstance, executeSave]);

  // useEffect to load from localStorage on mount
  useEffect(() => {
    const pendingDataString = localStorage.getItem('pendingCreateOnePager');
    if (pendingDataString) {
      try {
        const pendingData = JSON.parse(pendingDataString);
        if (pendingData.pendingAction === 'create') {
          console.log('Found pending create data in localStorage:', pendingData);
          if (pendingData.contentBlocks) {
            setEditorContent(pendingData.contentBlocks);
          }
          if (user && pendingData.saveIntent) {
            setSaveIntentAfterAuth(pendingData.saveIntent);
          }
          localStorage.removeItem('pendingCreateOnePager');
        }
      } catch (error) {
        console.error('Error parsing pending create data from localStorage:', error);
        localStorage.removeItem('pendingCreateOnePager');
      }
    }
  }, [user]);

  const handleEditorReady = useCallback((editor: BlockNoteEditorType) => {
    setEditorInstance(editor);
    setEditorContent(editor.document);
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
            <Button onClick={handleSaveDraft} disabled={isSaving || !editorInstance} variant="outline">
              {isSaving && currentSavingAction === 'draft' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Draft...
                </>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button onClick={handleSaveAndPublish} disabled={isSaving || !editorInstance} variant="default">
              {isSaving && currentSavingAction === 'publish' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
                </>
              ) : (
                'Save and Publish'
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
            <AuthSignInDialog onAuthSuccess={() => setIsAuthDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
