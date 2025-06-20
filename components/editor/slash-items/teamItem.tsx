import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { Users } from 'lucide-react'; // Using Users icon from new TeamBlock
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';
import { teamBlockConfig } from '../blocks/TeamBlock'; // Import to access prop defaults

export const insertTeamItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Team Section',
  onItemClick: () => {
    // Create complete team section with H1 + 2 paragraphs + team grid
    const teamSectionBlocks: PartialBlock<typeof editor.schema.blockSchema>[] = [
      {
        type: 'heading',
        props: {
          level: 1,
        },
        content: [
          {
            type: 'text',
            text: 'Our Team',
            styles: {},
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: "The A-Players You'll Be Working With",
            styles: {},
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Meet the dedicated professionals who will bring your project to life with expertise and passion.',
            styles: {},
          },
        ],
      },
      {
        type: 'team',
        props: {
          teamMembers: teamBlockConfig.propSchema.teamMembers.default,
        },
      },
    ];

    const insertedBlocks = editor.insertBlocks(teamSectionBlocks, editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      // Set cursor to the H1 heading so users can immediately edit it
      editor.setTextCursorPosition(insertedBlocks[0].id);
    }
  },
  aliases: ['team', 'members', 'people', 'staff', 'teamsection'],
  group: 'Custom Page Sections',
  icon: <Users size={18} />,
  subtext: 'Inserts a complete team section with heading, description, and member grid.',
});
