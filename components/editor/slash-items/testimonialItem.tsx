import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdFormatQuote } from 'react-icons/md'; // Using the same icon as in the block spec
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertTestimonialItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Testimonial',
  onItemClick: () => {
    const testimonialBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'testimonial',
      props: {
        authorName: 'Author Name',
        authorTitle: 'Their Title',
        companyName: 'Company Name',
        companyLogoURL: '',
        textAlignment: 'left',
      },
      content: [{ type: 'text', text: 'Quote placeholder...', styles: { italic: true } }],
    };

    editor.insertBlocks([testimonialBlock], editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['quote', 'customer', 'feedback'],
  group: 'Content Blocks',
  icon: <MdFormatQuote size={18} />,
  subtext: 'Inserts a customer testimonial block.',
});
