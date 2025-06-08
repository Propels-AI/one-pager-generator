import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdExtension } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertFeatureItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Feature Highlight',
  onItemClick: () => {
    const featureBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'feature',
      props: {},
      content: [{ type: 'text', text: 'Describe the feature here...', styles: {} }],
    };
    editor.insertBlocks([featureBlock], editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['feature', 'productfeature', 'highlight'],
  group: 'Custom Page Sections',
  icon: <MdExtension size={18} />,
  subtext: 'Inserts a feature highlight section.',
});
