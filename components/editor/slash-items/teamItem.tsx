import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdGroup } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertTeamItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Team Member',
  onItemClick: () => {
    const teamBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'team',
      props: {},
      content: [{ type: 'text', text: 'Team member bio or description...', styles: {} }],
    };
    editor.insertBlocks([teamBlock], editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['team', 'member', 'people'],
  group: 'Custom Page Sections',
  icon: <MdGroup size={18} />,
  subtext: 'Inserts a team member block.',
});
