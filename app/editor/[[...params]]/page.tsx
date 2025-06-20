'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth, useAuthWall } from '@/lib/hooks/useAuthWall';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchOnePagerById } from '@/lib/services/entityService';
import {
  useSaveDraft,
  useSaveAndPublish,
  useDeleteOnePager,
  useUpdateOnePager,
} from '@/lib/hooks/useOnePagerMutations';
import { Loader2, Eye, Edit3, Edit, Save, Globe, Trash2, Share2 } from 'lucide-react';
import { AuthSignInDialog } from '@/components/ui/AuthSignInDialog';
import dynamic from 'next/dynamic';
import type { CustomSchemaEditor as BlockNoteEditorType, PartialBlock } from '@/components/editor/BlockNoteEditor';
import { customSchema } from '@/components/editor/BlockNoteEditor';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ShareModal } from '@/components/one-pager/ShareModal';

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

export default function EditorPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const params = useParams();

  // Extract document ID from params - undefined means new document
  const documentId = Array.isArray(params.params) ? params.params[0] : params.params;
  const isNewDocument = !documentId;
  const onePagerPKToFetch = isNewDocument ? '' : `ONEPAGER#${documentId}`;

  // Auth wall - only protect existing documents, allow new documents for everyone
  const { shouldRender } = useAuthWall({
    redirectMessage: 'Editor Access Required',
    redirectDescription: 'You need to sign in to access this editor page.',
    autoRedirect: !isNewDocument, // Only auto-redirect for existing documents
  });

  // Default content for new documents
  const defaultContent: PartialBlock[] = [
    {
      type: 'paragraph' as const,
      content: [],
    },
  ];

  // Action-specific mutations - DECLARE ALL HOOKS BEFORE ANY CONDITIONAL RETURNS
  const saveDraftMutation = useSaveDraft();
  const saveAndPublishMutation = useSaveAndPublish();
  const deleteOnePagerMutation = useDeleteOnePager();
  const updateOnePagerMutation = useUpdateOnePager();

  const { data: existingOnePager, isLoading: isLoadingOnePager } = useQuery({
    queryKey: ['onePager', documentId || 'new'],
    queryFn: () => {
      if (!onePagerPKToFetch) {
        return Promise.resolve(null);
      }
      return fetchOnePagerById(onePagerPKToFetch);
    },
    // Only enable the query if:
    // 1. It's not a new document (has documentId)
    // 2. User is authenticated (prevents the JWT error)
    // 3. Auth loading is complete
    enabled: !isNewDocument && !!documentId && !!user && isLoaded,
  });

  const [editorInstance, setEditorInstance] = useState<BlockNoteEditorType | null>(null);
  const [editorContent, setEditorContent] = useState<PartialBlock[] | undefined>();
  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined>(
    isNewDocument ? defaultContent : undefined
  );
  const [internalTitle, setInternalTitle] = useState(isNewDocument ? 'Untitled Page' : '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [saveIntentAfterAuth, setSaveIntentAfterAuth] = useState<'draft' | 'publish' | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (existingOnePager) {
      setInternalTitle(existingOnePager.internalTitle || 'Untitled Page');
      try {
        const content = existingOnePager.contentBlocks ? JSON.parse(existingOnePager.contentBlocks) : [];
        // Ensure content is never empty for BlockNote
        const validContent = content.length > 0 ? content : defaultContent;
        setInitialContent(validContent);
        setEditorContent(validContent);
      } catch (e) {
        console.error('Failed to parse contentBlocks:', e);
        setInitialContent(defaultContent);
        setEditorContent(defaultContent);
      }
    }
  }, [existingOnePager]);

  const executeSaveDraft = useCallback(() => {
    if (!editorInstance || !user) {
      return alert('Editor is not ready or user session is invalid. Please try again.');
    }

    const finalInternalTitle = internalTitle.trim() || 'Untitled Page';
    const contentBlocks = editorInstance.document || [];

    saveDraftMutation.mutate({
      ownerUserId: isNewDocument ? user.userId : undefined,
      PK: isNewDocument ? undefined : onePagerPKToFetch,
      internalTitle: finalInternalTitle,
      contentBlocks,
      isNewDocument,
    });
  }, [editorInstance, user, internalTitle, isNewDocument, onePagerPKToFetch, saveDraftMutation]);

  const executeSaveAndPublish = useCallback(() => {
    if (!editorInstance || !user) {
      return alert('Editor is not ready or user session is invalid. Please try again.');
    }

    const finalInternalTitle = internalTitle.trim() || 'Untitled Page';
    const contentBlocks = editorInstance.document || [];

    saveAndPublishMutation.mutate({
      ownerUserId: isNewDocument ? user.userId : undefined,
      PK: isNewDocument ? undefined : onePagerPKToFetch,
      internalTitle: finalInternalTitle,
      contentBlocks,
      isNewDocument,
    });
  }, [editorInstance, user, internalTitle, isNewDocument, onePagerPKToFetch, saveAndPublishMutation]);

  const handleUnpublish = useCallback(() => {
    if (!editorInstance || !user || !existingOnePager?.PK || !existingOnePager?.contentBlocks) {
      return alert('Cannot unpublish: missing required data.');
    }

    const contentBlocks = JSON.parse(existingOnePager.contentBlocks);
    updateOnePagerMutation.mutate(
      {
        PK: existingOnePager.PK,
        internalTitle: internalTitle || 'Untitled Page',
        status: 'DRAFT',
        contentBlocks,
      },
      {
        onSuccess: () => {
          router.push('/dashboard'); // Redirect to dashboard after unpublishing
        },
      }
    );
  }, [editorInstance, user, existingOnePager, internalTitle, updateOnePagerMutation, router]);

  const handleDelete = useCallback(() => {
    if (!existingOnePager?.PK) {
      return alert('Cannot delete: missing page data.');
    }

    setIsDeleteDialogOpen(true);
  }, [existingOnePager]);

  const confirmDelete = useCallback(() => {
    if (existingOnePager?.PK) {
      deleteOnePagerMutation.mutate(existingOnePager.PK, {
        onSuccess: () => {
          router.push('/dashboard'); // Redirect to dashboard after deleting
        },
      });
    }
    setIsDeleteDialogOpen(false);
  }, [existingOnePager, deleteOnePagerMutation, router]);

  const handleUnpublishFromDialog = useCallback(() => {
    if (!editorInstance || !user || !existingOnePager?.PK || !existingOnePager?.contentBlocks) {
      return alert('Cannot unpublish: missing required data.');
    }

    const contentBlocks = JSON.parse(existingOnePager.contentBlocks);
    updateOnePagerMutation.mutate(
      {
        PK: existingOnePager.PK,
        internalTitle: internalTitle || 'Untitled Page',
        status: 'DRAFT',
        contentBlocks,
      },
      {
        onSuccess: () => {
          router.push('/dashboard'); // Redirect to dashboard after unpublishing
        },
      }
    );
    setIsDeleteDialogOpen(false);
  }, [editorInstance, user, existingOnePager, internalTitle, updateOnePagerMutation, router]);

  const handleOpenShareModal = useCallback(() => {
    setShareModalOpen(true);
  }, []);

  const handleSaveDraft = () => {
    if (!editorInstance) {
      return alert('Editor not available.');
    }

    if (user) {
      executeSaveDraft();
    } else {
      // Store state for auth wall (new document flow)
      if (isNewDocument) {
        // Clear any existing returnTo to prevent conflicts
        localStorage.removeItem('returnToAfterAuth');

        localStorage.setItem(
          'pendingOnePager',
          JSON.stringify({
            pendingAction: 'create',
            contentBlocks: editorInstance.document,
            internalTitle: internalTitle,
            saveIntent: 'draft',
            returnTo: '/editor',
          })
        );
      }
      setSaveIntentAfterAuth('draft');
      setIsAuthDialogOpen(true);
    }
  };

  const handleSaveAndPublish = () => {
    if (!editorInstance) return alert('Editor not available.');

    if (user) {
      executeSaveAndPublish();
    } else {
      // Store state for auth wall (new document flow)
      if (isNewDocument) {
        // Clear any existing returnTo to prevent conflicts
        localStorage.removeItem('returnToAfterAuth');

        localStorage.setItem(
          'pendingOnePager',
          JSON.stringify({
            pendingAction: 'create',
            contentBlocks: editorInstance.document,
            internalTitle: internalTitle,
            saveIntent: 'publish',
            returnTo: '/editor',
          })
        );
      }
      setSaveIntentAfterAuth('publish');
      setIsAuthDialogOpen(true);
    }
  };

  // Effect to restore data from localStorage after OAuth redirect
  useEffect(() => {
    // Only check for pending data on new documents when user becomes available
    if (!user || !isNewDocument) return;

    const pendingDataString = localStorage.getItem('pendingOnePager');
    if (pendingDataString) {
      try {
        const pendingData = JSON.parse(pendingDataString);
        if (pendingData.pendingAction === 'create') {
          // Restore title immediately
          if (pendingData.internalTitle) {
            setInternalTitle(pendingData.internalTitle);
          }

          // Set initial content that will be loaded by the editor
          if (pendingData.contentBlocks) {
            const restoredContent = pendingData.contentBlocks.length > 0 ? pendingData.contentBlocks : defaultContent;
            setInitialContent(restoredContent);
            setEditorContent(restoredContent);
          }

          // Store the save intent to execute once editor is ready
          if (pendingData.saveIntent) {
            setSaveIntentAfterAuth(pendingData.saveIntent);
          }

          localStorage.removeItem('pendingOnePager');
        }
      } catch (error) {
        console.error('Error parsing pending data from localStorage:', error);
        localStorage.removeItem('pendingOnePager');
      }
    }
  }, [user, isNewDocument]);

  // Separate effect to handle saving once editor is ready
  useEffect(() => {
    if (!user || !editorInstance || !saveIntentAfterAuth) return;

    if (saveIntentAfterAuth === 'publish') {
      executeSaveAndPublish();
    } else {
      executeSaveDraft();
    }

    setSaveIntentAfterAuth(null);
  }, [user, editorInstance, saveIntentAfterAuth, executeSaveDraft, executeSaveAndPublish]);

  const handleEditorReady = useCallback((editor: BlockNoteEditorType) => {
    setEditorInstance(editor);
    editor.onChange(() => {
      setEditorContent(editor.document as PartialBlock[]);
    });
  }, []);

  const handleTitleEdit = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleTitleSave = useCallback(
    (newTitle: string) => {
      setInternalTitle(newTitle.trim() || 'Untitled Page');
      setIsEditingTitle(false);
      // Auto-save the title change if user is authenticated and document exists
      if (user && !isNewDocument && editorInstance) {
        // Trigger save with current publish status
        const isCurrentlyPublished = existingOnePager?.status === 'PUBLISHED';
        if (isCurrentlyPublished) {
          executeSaveAndPublish();
        } else {
          executeSaveDraft();
        }
      }
    },
    [user, isNewDocument, editorInstance, existingOnePager, executeSaveAndPublish, executeSaveDraft]
  );

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleTitleSave((e.target as HTMLInputElement).value);
      }
    },
    [handleTitleSave]
  );

  // For existing documents, enforce authentication
  if (!isNewDocument) {
    if (!isLoaded) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-4 text-lg">Checking authentication...</p>
        </div>
      );
    }

    if (!shouldRender) {
      return null; // Auth wall is handling redirect
    }
  }

  // Show loading while fetching existing one-pager data
  if (isLoadingOnePager) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-lg">Loading Page...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mr-auto flex items-center gap-2">
            {isEditingTitle ? (
              <Input
                autoFocus
                value={internalTitle}
                onChange={(e) => setInternalTitle(e.target.value)}
                onBlur={(e) => handleTitleSave(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="font-semibold text-lg border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent min-w-[200px] outline-none"
                placeholder="Untitled Page"
                style={{
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  fontWeight: 'inherit',
                }}
              />
            ) : (
              <div className="flex items-center gap-2 cursor-pointer group" onDoubleClick={handleTitleEdit}>
                <h1 className="font-semibold text-lg">{internalTitle}</h1>
                <Edit
                  className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleTitleEdit}
                />
              </div>
            )}
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              onClick={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
              variant="outline"
              aria-label={viewMode === 'editor' ? 'Switch to Preview' : 'Switch to Editor'}
              className="gap-2"
            >
              {viewMode === 'editor' ? (
                <>
                  <Eye className="h-4 w-4" />
                  Preview
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending || !editorInstance}
              variant="outline"
              className="gap-2"
            >
              {saveDraftMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save
                </>
              )}
            </Button>

            {/* Manage Shares Button - only for published pages */}
            {existingOnePager?.status === 'PUBLISHED' && (
              <Button onClick={handleOpenShareModal} variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Manage Shares
              </Button>
            )}

            {/* Dynamic Publish/Unpublish Button */}
            {existingOnePager?.status === 'PUBLISHED' ? (
              <Button
                onClick={handleUnpublish}
                disabled={updateOnePagerMutation.isPending || !editorInstance}
                variant="outline"
                className="gap-2"
              >
                {updateOnePagerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Unpublishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" /> Unpublish
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSaveAndPublish}
                disabled={saveAndPublishMutation.isPending || !editorInstance}
                variant="default"
                className="gap-2"
              >
                {saveAndPublishMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" /> Publish
                  </>
                )}
              </Button>
            )}

            {/* Delete Button - only for authenticated users with existing documents */}
            {user && !isNewDocument && existingOnePager && (
              <Button
                onClick={handleDelete}
                disabled={deleteOnePagerMutation.isPending}
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {deleteOnePagerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Delete
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 pt-8 pb-4 max-w-screen-xl">
        <div className="flex flex-col gap-6">
          {/* Editor - always mounted, visibility controlled by CSS */}
          <div className={`w-full ${viewMode === 'editor' ? 'block' : 'hidden'}`}>
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

          {/* Preview - only render when in preview mode */}
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
          <DialogContent className="sm:max-w-[425px] p-0 overflow-y-auto max-h-[90vh]">
            <AuthSignInDialog
              isInDialog={true}
              onAuthSuccess={() => {
                setIsAuthDialogOpen(false);
                // The user effect will handle the pending save action
                // No need to redirect since we're already on the right page
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete or Unpublish Page?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              Deleting this page will permanently delete the page and all shared links. Your recipients will no longer
              have access to the page. <strong>This action cannot be undone.</strong>
              <br />
              <br />
              Alternatively, you can unpublish the page to temporarily disable all shared links. They will be
              reactivated once you publish the page again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} className="order-3 sm:order-1">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="default"
              onClick={handleUnpublishFromDialog}
              className="order-2"
              disabled={updateOnePagerMutation.isPending}
            >
              {updateOnePagerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unpublishing...
                </>
              ) : (
                'Unpublish'
              )}
            </Button>
            <AlertDialogAction
              onClick={confirmDelete}
              className="order-1 sm:order-3 bg-red-600 hover:bg-red-700"
              disabled={deleteOnePagerMutation.isPending}
            >
              {deleteOnePagerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareModal
        onePager={existingOnePager || null}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}
