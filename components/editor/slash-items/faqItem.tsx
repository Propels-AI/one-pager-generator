import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdQuestionAnswer } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertFAQItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'FAQ Item',
  onItemClick: () => {
    const faqBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'faq',
      props: {
        question: 'What is a common question?',
      },
      content: [{ type: 'text', text: 'Provide a clear and concise answer here.', styles: {} }],
    };
    const insertedBlocks = editor.insertBlocks([faqBlock], editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      editor.setTextCursorPosition(insertedBlocks[0].id, 'end');
    }
  },
  aliases: ['faq', 'question', 'answer'],
  group: 'Custom Page Sections',
  icon: <MdQuestionAnswer size={18} />,
  subtext: 'Inserts an FAQ question and answer block.',
});
