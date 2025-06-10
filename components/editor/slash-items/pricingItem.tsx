import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdPriceCheck } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertPricingItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Pricing Tier',
  onItemClick: () => {
    const pricingBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'pricing',
      props: {},
      content: [{ type: 'text', text: 'Description of this pricing plan...', styles: {} }],
    };
    const insertedBlocks = editor.insertBlocks([pricingBlock], editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      editor.setTextCursorPosition(insertedBlocks[0].id, 'end');
    }
  },
  aliases: ['pricing', 'plan', 'tier', 'cost'],
  group: 'Custom Page Sections',
  icon: <MdPriceCheck size={18} />,
  subtext: 'Inserts a pricing tier block.',
});
