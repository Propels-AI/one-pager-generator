import type { CustomSchemaEditor } from '../BlockNoteEditor';
import { Share2 } from 'lucide-react';

export const insertSocial = (editor: CustomSchemaEditor) => ({
  title: 'Add Social Link',
  onItemClick: () => {
    editor.insertBlocks(
      [
        {
          type: 'social',
          props: {
            platform: 'twitter',
            displayText: 'Twitter',
            url: 'https://',
            backgroundColor: 'default',
            textColor: 'default',
            startInEditMode: true,
          },
        },
      ],
      editor.getTextCursorPosition().block,
      'after'
    );
  },
  aliases: ['social', 'icon', 'link', 'profile', 'contact'],
  group: 'Custom Page Sections',
  icon: <Share2 size={18} />,
  subtext: 'Insert a social media link with an icon.',
});
