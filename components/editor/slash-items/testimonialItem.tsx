import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdFormatQuote } from 'react-icons/md'; // Using the same icon as in the block spec
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertTestimonialItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Testimonial Section',
  onItemClick: () => {
    const defaultSubItems = [
      {
        id: '1',
        quote: 'This is a fantastic product that has revolutionized our workflow.',
        avatarUrl: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg',
        authorName: 'Jane Smith',
        authorTitle: 'Project Manager, Innovate Corp',
      },
      {
        id: '2',
        quote: 'The customer support is top-notch, and the features are exactly what we need.',
        avatarUrl: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg',
        authorName: 'Samuel Lee',
        authorTitle: 'Lead Developer, Tech Solutions',
      },
      {
        id: '3',
        quote: 'I highly recommend this to anyone looking to boost their productivity.',
        avatarUrl: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-4.svg',
        authorName: 'Emily White',
        authorTitle: 'Marketing Director, Growth Co.',
      },
    ];

    const testimonialBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'testimonial',
      props: {
        mainImageUrl: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg',
        mainQuote: 'This product has been a game-changer for our team. The results speak for themselves.',
        mainAuthorName: 'Alex Johnson',
        mainAuthorTitle: 'CEO, Future Enterprises',
        subItems: JSON.stringify(defaultSubItems),
      },
    };

    editor.insertBlocks([testimonialBlock], editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['quote', 'customer', 'feedback', 'testimonial'],
  group: 'Custom Page Sections',
  icon: <MdFormatQuote size={18} />,
  subtext: 'Inserts a multi-item testimonial section.',
});
