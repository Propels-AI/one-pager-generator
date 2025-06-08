import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdAdsClick } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertCallToActionItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Call To Action',
  onItemClick: () => {
    const callToActionBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'callToAction',
      props: {
        buttonText: 'Sign Up Now',
        buttonURL: '#',
      },
      content: [{ type: 'text', text: 'Encourage your audience to take the next step! ', styles: {} }],
    };
    editor.insertBlocks([callToActionBlock], editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['cta', 'signup', 'action'],
  group: 'Custom Page Sections',
  icon: <MdAdsClick size={18} />,
  subtext: 'Inserts a call to action button with text.',
});
