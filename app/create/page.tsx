'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useCreateOnePager } from '@/lib/hooks/useOnePagerMutations';
import { Loader2, Eye, Edit3 } from 'lucide-react';
import { AuthSignInDialog } from '@/components/ui/AuthSignInDialog';
import dynamic from 'next/dynamic';
import type { CustomSchemaEditor as BlockNoteEditorType, PartialBlock } from '@/components/editor/BlockNoteEditor';
import { customSchema } from '@/components/editor/BlockNoteEditor';
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

export default function CreateOnePagerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createMutation = useCreateOnePager();

  const [editorInstance, setEditorInstance] = useState<BlockNoteEditorType | null>(null);
  const [editorContent, setEditorContent] = useState<PartialBlock<typeof customSchema.blockSchema>[] | undefined>(
    undefined
  );

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [saveIntentAfterAuth, setSaveIntentAfterAuth] = useState<'draft' | 'publish' | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  // Computed loading state from mutation
  const isSaving = createMutation.isPending;
  const currentSavingAction = createMutation.isPending ? 'creating' : null;

  const extractTitleFromEditor = useCallback(() => {
    const editorBlocks = editorInstance?.document || [];
    const firstHeading = editorBlocks.find(
      (block: any) => block.type === 'heading' && block.content && block.content.length > 0
    );

    let titleFromEditor = '';
    if (firstHeading && Array.isArray(firstHeading.content)) {
      titleFromEditor = firstHeading.content.map((content: any) => content.text || '').join('');
    }

    return titleFromEditor.trim() || 'Untitled One-Pager';
  }, [editorInstance]);

  const executeSave = useCallback(
    (isPublishing: boolean) => {
      if (!editorInstance || !user) {
        return alert('Editor not available or user not authenticated.');
      }

      const finalInternalTitle = extractTitleFromEditor();
      const contentBlocks = editorInstance.document || [];
      const status = isPublishing ? 'PUBLISHED' : 'DRAFT';

      createMutation.mutate({
        ownerUserId: user.userId,
        internalTitle: finalInternalTitle,
        status,
        contentBlocks,
      });
    },
    [editorInstance, user, extractTitleFromEditor, createMutation]
  );

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
              {isSaving && currentSavingAction === 'creating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Draft...
                </>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button onClick={handleSaveAndPublish} disabled={isSaving || !editorInstance} variant="default">
              {isSaving && currentSavingAction === 'creating' ? (
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
