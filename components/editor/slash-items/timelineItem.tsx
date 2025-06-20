import { MdTimeline } from 'react-icons/md';
import { timelinePropsDefinition } from '../blocks/TimelineBlock';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

const getDefaultTimelineProps = () => {
  const defaults: { [key: string]: any } = {};
  for (const key in timelinePropsDefinition) {
    if (Object.prototype.hasOwnProperty.call(timelinePropsDefinition, key)) {
      defaults[key] = (timelinePropsDefinition as any)[key].default;
    }
  }
  return defaults;
};

export const insertTimelineItem = (editor: CustomSchemaEditor) => ({
  title: 'Timeline Section',
  onItemClick: () => {
    const timelineSectionBlocks: PartialBlock<typeof editor.schema.blockSchema>[] = [
      {
        type: 'heading',
        props: {
          level: 1,
        },
        content: [
          {
            type: 'text',
            text: 'Our Journey',
            styles: {},
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Follow our progress through key milestones and achievements that shaped our path forward.',
            styles: {},
          },
        ],
      },
      {
        type: 'timeline',
        props: getDefaultTimelineProps(),
      },
    ];

    const insertedBlocks = editor.insertBlocks(timelineSectionBlocks, editor.getTextCursorPosition().block, 'after');

    if (insertedBlocks.length > 0) {
      // Set cursor to the H1 heading so users can immediately edit it
      editor.setTextCursorPosition(insertedBlocks[0].id);
    }
  },
  aliases: ['timeline', 'history', 'events', 'chronology', 'journey'],
  group: 'Custom Page Sections',
  icon: <MdTimeline size={18} />,
  subtext: 'Insert a complete timeline section with heading, description, and chronological events.',
});
