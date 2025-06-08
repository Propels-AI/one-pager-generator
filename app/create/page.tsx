'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Loader2 } from 'lucide-react';
import { AuthSignInDialog } from '@/components/ui/AuthSignInDialog';
import dynamic from 'next/dynamic';
import type { CustomSchemaEditor as BlockNoteEditorType } from '@/components/editor/BlockNoteEditor';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const BlockNoteEditor = dynamic(() => import('@/components/editor/BlockNoteEditor'), {
  ssr: false,
  loading: () => (
    <div className="p-4 border rounded-md min-h-[300px] flex items-center justify-center text-muted-foreground">
      Loading Editor...
    </div>
  ),
});

const client = generateClient<Schema>();

export default function CreateOnePagerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [editorInstance, setEditorInstance] = useState<BlockNoteEditorType | null>(null);
  const [internalTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [saveAttemptedBeforeAuth, setSaveAttemptedBeforeAuth] = useState(false);

  const executeSave = async () => {
    const finalInternalTitle = internalTitle.trim() || 'Untitled One-Pager';
    if (!editorInstance || !user) {
      alert('Title is missing or user session is invalid. Please try again.');
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const contentJSON = editorInstance.document;
    const onePagerData = {
      baseOnePagerId: crypto.randomUUID(),
      itemSK: 'METADATA',
      ownerUserId: user.userId,
      internalTitle: finalInternalTitle,
      status: 'DRAFT',
      statusUpdatedAt: `STATUS#DRAFT#${new Date().toISOString()}`,
      templateId: 'default_template_v1',
      contentBlocks: JSON.stringify(contentJSON),
    };

    try {
      const { data: newOnePager, errors } = await client.models.OnePager.create(onePagerData);
      if (errors) {
        console.error('Error creating OnePager:', errors);
        alert(`Error creating OnePager: ${errors.map((e) => e.message).join('\n')}`);
      } else if (newOnePager) {
        console.log('OnePager created:', newOnePager);
        alert('One-Pager saved successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected error creating OnePager:', error);
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
        console.log('Auto-save conditions met, but title or editor missing. User may need to click save again.');
      }
      setSaveAttemptedBeforeAuth(false); // Reset the flag
    }
  }, [user, saveAttemptedBeforeAuth, isAuthDialogOpen, editorInstance, executeSave]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full backdrop-blur">
        <div className="container flex h-14 items-center max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center justify-end">
            <Button onClick={handleSave} disabled={isSaving} variant="default">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : user ? (
                'Save'
              ) : (
                'Sign in to Save'
              )}
            </Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-3xl flex-grow">
        <div className="rounded-md min-h-[calc(100vh-120px)]">
          <BlockNoteEditor onEditorReady={setEditorInstance} />
        </div>
      </div>
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
