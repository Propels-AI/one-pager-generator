import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdAdsClick } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';
import { callToActionBlockConfig } from '../blocks/CallToActionBlock'; // Import to access prop defaults if needed

export const insertCallToActionItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Call To Action Section',
  onItemClick: () => {
    const callToActionBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'callToAction',
      props: {
        // Initialize with default or slightly modified values from the schema
        heading: callToActionBlockConfig.propSchema.heading.default,
        description: 'A compelling message to encourage user action.',
        primaryButtonText: callToActionBlockConfig.propSchema.primaryButtonText.default,
        primaryButtonHref: callToActionBlockConfig.propSchema.primaryButtonHref.default,
        secondaryButtonText: callToActionBlockConfig.propSchema.secondaryButtonText.default,
        secondaryButtonHref: callToActionBlockConfig.propSchema.secondaryButtonHref.default,
      },
      // No 'content' needed as it's a 'none' content block
    };
    const insertedBlocks = editor.insertBlocks([callToActionBlock], editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      // It's a 'none' content block, so focusing behavior might differ. 
      // Setting cursor to the block itself or the next block might be more appropriate.
      // For now, let's try to select the block.
      editor.setTextCursorPosition(insertedBlocks[0].id);
    }
  },
  aliases: ['cta', 'signup', 'action', 'calltoactionsection'],
  group: 'Custom Page Sections',
  icon: <MdAdsClick size={18} />,
  subtext: 'Inserts a customizable Call To Action section.',
});
