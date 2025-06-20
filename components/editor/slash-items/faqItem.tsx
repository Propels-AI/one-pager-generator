import { HelpCircle } from 'lucide-react';
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import { faqBlockConfig } from '../blocks/FAQBlock';

// Defines a slash menu item for inserting an FAQ section.
export const insertFaq = (editor: BlockNoteEditor<any>) => ({
  title: 'FAQ Section',
  onItemClick: () => {
    const faqSectionBlocks: PartialBlock<any>[] = [
      {
        type: 'heading',
        props: {
          level: 1,
        },
        content: [
          {
            type: 'text',
            text: 'Frequently Asked Questions',
            styles: {},
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Here are the most common questions we get from our community. If you have something else in mind, feel free to reach out!',
            styles: {},
          },
        ],
      },
      {
        type: 'faq',
        props: {
          items: faqBlockConfig.propSchema.items.default,
          backgroundColor: faqBlockConfig.propSchema.backgroundColor.default,
        },
      },
    ];

    const insertedBlocks = editor.insertBlocks(faqSectionBlocks, editor.getTextCursorPosition().block, 'after');

    if (insertedBlocks.length > 0) {
      // Set cursor to the H1 heading so users can immediately edit it
      editor.setTextCursorPosition(insertedBlocks[0].id);
    }
  },
  aliases: ['faq', 'questions', 'accordion', 'frequently asked questions'],
  group: 'Custom Page Sections',
  icon: <HelpCircle size={18} />,
  subtext: 'Inserts a complete FAQ section with heading, description, and collapsible Q&A list.',
});
