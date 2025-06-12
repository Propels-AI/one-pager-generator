import React from 'react';
import type { PartialBlock } from '@blocknote/core';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { Lightbulb as SolutionIcon } from 'lucide-react';
import type { CustomSchemaEditor } from '../BlockNoteEditor';

export const insertSolutionItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Solution Section',
  onItemClick: () => {
    const solutionStatement: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'heading',
      props: {
        level: 1,
        textAlignment: 'left',
      },
      content: [{ type: 'text', text: 'Our Solution', styles: { bold: false } }],
    };

    const solutionDescription: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Describe how your product or service effectively solves the problem. Highlight what makes your solution unique and valuable. ',
          styles: {},
        },
      ],
    };

    const bulletPoint1: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Key benefit or feature 1...', styles: {} }],
    };
    const bulletPoint2: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Key benefit or feature 2...', styles: {} }],
    };
    const bulletPoint3: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Key benefit or feature 3...', styles: {} }],
    };

    const blocksToInsert = [solutionStatement, solutionDescription, bulletPoint1, bulletPoint2, bulletPoint3];

    const insertedBlocks = editor.insertBlocks(blocksToInsert, editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      editor.setTextCursorPosition(insertedBlocks[0].id, 'end');
    }
  },
  aliases: ['solution', 'answer', 'resolution', 'fix'],
  group: 'Custom Page Sections',
  icon: <SolutionIcon size={18} />,
  subtext: 'Inserts a structured solution section template.',
});
