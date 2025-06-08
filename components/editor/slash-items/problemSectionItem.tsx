import React from 'react';
import type { PartialBlock } from '@blocknote/core';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { AlertTriangle as ProblemIcon } from 'lucide-react';
import type { CustomSchemaEditor } from '../BlockNoteEditor';

export const insertProblemSectionItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Problem Section',
  onItemClick: () => {
    const problemStatement: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'customHeading',
      props: {
        level: 2,
        textAlignment: 'center',
      },
      content: [{ type: 'text', text: 'The Core Problem', styles: { bold: true } }],
    };

    const problemDescription1: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Describe the primary challenge or pain point your audience faces. Be specific and relatable. ',
          styles: {},
        },
      ],
    };

    const problemDescription2: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Elaborate on the consequences of this problem if left unaddressed. What are the negative impacts? ',
          styles: {},
        },
      ],
    };

    const bulletPoint1: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Key aspect of the problem 1...', styles: {} }],
    };
    const bulletPoint2: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Key aspect of the problem 2...', styles: {} }],
    };
    const bulletPoint3: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Key aspect of the problem 3...', styles: {} }],
    };

    const blocksToInsert = [
      problemStatement,
      problemDescription1,
      problemDescription2,
      bulletPoint1,
      bulletPoint2,
      bulletPoint3,
    ];

    editor.insertBlocks(blocksToInsert, editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['problem', 'issue', 'challenge', 'painpoint'],
  group: 'Sections',
  icon: <ProblemIcon size={18} />,
  subtext: 'Inserts a structured problem section template.',
});
