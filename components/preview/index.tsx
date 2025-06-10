'use client';

import React from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';
import { customSchema, type CustomSchemaEditor } from '@/components/editor/BlockNoteEditor';

interface PreviewProps {
  content: PartialBlock<(typeof customSchema)['blockSchema']>[] | undefined;
}

export const Preview: React.FC<PreviewProps> = ({ content }) => {
  // Handles undefined or empty blocks array.
  if (!content || content.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <p>Start typing in the editor to see the preview.</p>
      </div>
    );
  }

  const editor: CustomSchemaEditor = useCreateBlockNote({
    schema: customSchema,
    initialContent: content,
  });

  // Renders the editor content as a non-editable view.
  return <BlockNoteView editor={editor} editable={false} theme={'light'} />;
};

export default Preview;
