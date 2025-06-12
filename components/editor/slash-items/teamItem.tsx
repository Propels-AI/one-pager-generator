import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { Users } from 'lucide-react'; // Using Users icon from new TeamBlock
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';
import { teamBlockConfig } from '../blocks/TeamBlock'; // Import to access prop defaults

export const insertTeamItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Team Section',
  onItemClick: () => {
    const teamBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'team',
      props: {
        mainHeading: teamBlockConfig.propSchema.mainHeading.default,
        subHeading: teamBlockConfig.propSchema.subHeading.default,
        descriptionParagraph: teamBlockConfig.propSchema.descriptionParagraph.default,
        teamMembers: teamBlockConfig.propSchema.teamMembers.default,
      },
      // No 'content' needed as it's a 'none' content block
    };
    const insertedBlocks = editor.insertBlocks([teamBlock], editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      editor.setTextCursorPosition(insertedBlocks[0].id);
    }
  },
  aliases: ['team', 'members', 'people', 'staff', 'teamsection'],
  group: 'Custom Page Sections',
  icon: <Users size={18} />,
  subtext: 'Inserts a customizable team section.',
});
