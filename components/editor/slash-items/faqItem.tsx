import { HelpCircle } from 'lucide-react';
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import { faqBlockConfig } from '../blocks/FAQBlock'; // Ensure this path is correct

// Defines a slash menu item for inserting an FAQ block.
export const insertFaq = (editor: BlockNoteEditor<any>) => ({
  title: 'FAQ Section',
  onItemClick: () => {
    // Block to insert.
    const faqBlock: PartialBlock<any> = {
      type: 'faq',
      props: {
        // Use default props from the block's config
        heading: faqBlockConfig.propSchema.heading.default,
        items: faqBlockConfig.propSchema.items.default,
      },
      // No 'content' field here as faqBlockConfig.content is 'none'
    };

    editor.insertBlocks(
      [faqBlock],
      editor.getTextCursorPosition().block,
      'after'
    );
  },
  aliases: ['faq', 'questions', 'accordion', 'frequently asked questions'],
  group: 'Custom Page Sections',
  icon: <HelpCircle size={18} />,
  subtext: 'Inserts a collapsible FAQ section.',
});
