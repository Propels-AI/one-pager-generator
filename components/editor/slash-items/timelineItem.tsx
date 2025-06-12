import { MdTimeline } from 'react-icons/md';
import { timelinePropsDefinition } from '../blocks/TimelineBlock';
import type { CustomSchemaEditor } from '../BlockNoteEditor';

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
  title: 'Timeline',
  onItemClick: () => {
    editor.insertBlocks(
      [
        {
          type: 'timeline',
          props: getDefaultTimelineProps(),
        },
      ],
      editor.getTextCursorPosition().block,
      'after'
    );
  },
  aliases: ['timeline', 'history', 'events', 'chronology'],
  group: 'Custom Blocks',
  icon: <MdTimeline size={18} />,
  subtext: 'Insert a customizable timeline section.',
});
