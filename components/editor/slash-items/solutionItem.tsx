import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdLightbulbOutline } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertSolutionItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Solution Overview',
  onItemClick: () => {
    const solutionBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'solution',
      props: {},
      content: [{ type: 'text', text: 'Explain the solution here...', styles: {} }],
    };
    editor.insertBlocks([solutionBlock], editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['solution', 'remedy', 'fix'],
  group: 'Custom Page Sections',
  icon: <MdLightbulbOutline size={18} />,
  subtext: 'Inserts a solution overview section.',
});
