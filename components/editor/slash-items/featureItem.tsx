import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdExtension } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

import { TrendingUp } from 'lucide-react';

export const insertFeatureItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Feature Section',
  onItemClick: () => {
    const featureStatement: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'heading',
      props: {
        level: 1,
        textAlignment: 'left',
      },
      content: [{ type: 'text', text: 'Key Features', styles: { bold: false } }],
    };

    const featureDescription: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Highlight the main features or benefits of your product or service. Explain what sets your offering apart.',
          styles: {},
        },
      ],
    };

    const bulletPoint1: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Feature or benefit 1...', styles: {} }],
    };
    const bulletPoint2: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Feature or benefit 2...', styles: {} }],
    };
    const bulletPoint3: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Feature or benefit 3...', styles: {} }],
    };

    const blocksToInsert = [featureStatement, featureDescription, bulletPoint1, bulletPoint2, bulletPoint3];

    const insertedBlocks = editor.insertBlocks(blocksToInsert, editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      editor.setTextCursorPosition(insertedBlocks[0].id, 'end');
    }
  },
  aliases: ['feature', 'productfeature', 'highlight'],
  group: 'Custom Page Sections',
  icon: <TrendingUp size={18} />,
  subtext: 'Inserts a structured feature section template.',
});
