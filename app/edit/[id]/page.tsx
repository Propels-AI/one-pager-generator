'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchOnePagerById } from '@/lib/services/entityService';
import { useCreateOnePager, useUpdateOnePager } from '@/lib/hooks/useOnePagerMutations';
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

export default function EditOnePagerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const idFromUrl = params.id ? decodeURIComponent(params.id as string) : '';
  const isCreateMode = idFromUrl === 'new';
  const onePagerPKToFetch = isCreateMode || !idFromUrl ? '' : `ONEPAGER#${idFromUrl}`;

  // TanStack Query mutations
  const createMutation = useCreateOnePager();
  const updateMutation = useUpdateOnePager();

  const { data: existingOnePager, isLoading: isLoadingOnePager } = useQuery({
    queryKey: ['onePager', idFromUrl],
    queryFn: () => {
      if (!onePagerPKToFetch) {
        return Promise.resolve(null);
      }
      return fetchOnePagerById(onePagerPKToFetch);
    },
    enabled: !isCreateMode && !!idFromUrl,
  });

  const [editorInstance, setEditorInstance] = useState<BlockNoteEditorType | null>(null);
  const [editorContent, setEditorContent] = useState<PartialBlock[] | undefined>();
  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined>(isCreateMode ? [] : undefined);
  const [internalTitle, setInternalTitle] = useState('');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [saveIntentAfterAuth, setSaveIntentAfterAuth] = useState<'draft' | 'publish' | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  // Computed loading state from mutations
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const currentSavingAction = createMutation.isPending ? 'creating' : updateMutation.isPending ? 'updating' : null;

  useEffect(() => {
    if (existingOnePager) {
      setInternalTitle(existingOnePager.internalTitle || 'Untitled One-Pager');
      try {
        const content = existingOnePager.contentBlocks ? JSON.parse(existingOnePager.contentBlocks) : [];
        setInitialContent(content);
        setEditorContent(content);
      } catch (e) {
        console.error('Failed to parse contentBlocks:', e);
        setInitialContent([]);
        setEditorContent([]);
      }
    }
  }, [existingOnePager]);

  const extractTitleFromEditor = useCallback(() => {
    const editorBlocks = editorInstance?.document || [];
    const firstHeading = editorBlocks.find(
      (block: any) => block.type === 'heading' && block.content && block.content.length > 0
    );

    let titleFromEditor = '';
    if (firstHeading && Array.isArray(firstHeading.content)) {
      titleFromEditor = firstHeading.content.map((content: any) => content.text || '').join('');
    }

    return titleFromEditor.trim() || internalTitle.trim() || 'Untitled One-Pager';
  }, [editorInstance, internalTitle]);

  const executeSave = useCallback(
    async (isPublishing: boolean) => {
      if (!editorInstance || !user) {
        return alert('Editor is not ready or user session is invalid. Please try again.');
      }

      const finalInternalTitle = extractTitleFromEditor();
      const contentBlocks = editorInstance.document || [];
      const status = isPublishing ? 'PUBLISHED' : 'DRAFT';

      if (isCreateMode) {
        createMutation.mutate({
          ownerUserId: user.userId,
          internalTitle: finalInternalTitle,
          status,
          contentBlocks,
        });
      } else {
        updateMutation.mutate({
          PK: onePagerPKToFetch,
          internalTitle: finalInternalTitle,
          status,
          contentBlocks,
        });
      }
    },
    [editorInstance, user, isCreateMode, onePagerPKToFetch, extractTitleFromEditor, createMutation, updateMutation]
  );

  const handleSaveDraft = () => {
    if (!editorInstance) {
      return alert('Editor not available.');
    }

    if (user) {
      executeSave(false);
    } else {
      setSaveIntentAfterAuth('draft');
      setIsAuthDialogOpen(true);
    }
  };

  const handleSaveAndPublish = () => {
    if (!editorInstance) return alert('Editor not available.');
    if (user) executeSave(true);
    else {
      setSaveIntentAfterAuth('publish');
      setIsAuthDialogOpen(true);
    }
  };

  useEffect(() => {
    if (user && saveIntentAfterAuth && !isAuthDialogOpen && editorInstance) {
      executeSave(saveIntentAfterAuth === 'publish');
      setSaveIntentAfterAuth(null);
    }
  }, [user, saveIntentAfterAuth, isAuthDialogOpen, editorInstance, executeSave]);

  const handleEditorReady = useCallback((editor: BlockNoteEditorType) => {
    setEditorInstance(editor);
    editor.onChange(() => {
      setEditorContent(editor.document as PartialBlock[]);
    });
  }, []);

  if (isLoadingOnePager) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-lg">Loading One-Pager...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mr-auto flex items-center">
            <h1 className="font-semibold text-lg">
              {isCreateMode ? 'Create One-Pager' : 'Edit One-Pager'} ({viewMode === 'editor' ? 'Editing' : 'Previewing'}
              )
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
              {isSaving && currentSavingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button onClick={handleSaveAndPublish} disabled={isSaving || !editorInstance} variant="default">
              {isSaving && currentSavingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isCreateMode ? 'Publishing...' : 'Publishing...'}
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
            <div className="w-full">
              <div className="rounded-lg min-h-[calc(100vh-120px)] bg-white dark:bg-gray-950 overflow-hidden">
                {initialContent !== undefined ? (
                  <BlockNoteEditor onEditorReady={handleEditorReady} initialContent={initialContent} />
                ) : (
                  <div className="p-4 border rounded-md min-h-[calc(100vh-120px)] flex items-center justify-center text-muted-foreground bg-white dark:bg-gray-900">
                    Loading Content...
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="w-full h-full md:max-h-[calc(100vh-theme(spacing.14)-4rem)] overflow-y-auto">
              <div className="p-6 bg-white dark:bg-gray-950 rounded-lg min-h-[calc(100vh-120px)] md:min-h-0">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b pb-2">
                  Live Preview
                </h2>
                {editorContent ? (
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
