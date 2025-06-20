'use client';

import React, { useEffect } from 'react';
import {
  BlockNoteEditor,
  PartialBlock,
  BlockNoteSchema,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
  defaultBlockSpecs,
  filterSuggestionItems,
} from '@blocknote/core';
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
} from '@blocknote/react';
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import {
  HeadlineBlockSpec,
  testimonialBlockSpec,
  featureBlockSpec,
  solutionBlockSpec,
  CallToActionBlockSpec,
  TeamBlockSpec,
  FaqBlockSpec,
  problemBlockSpec,
  SocialBlockSpec,
  TimelineBlockSpec,
  ImageCarouselBlockSpec,
} from './blocks';
import {
  insertProblemSectionItem,
  insertTestimonialItem,
  insertFeatureItem,
  insertSolutionItem,
  insertCallToActionItem,
  insertTeamItem,
  insertFaq,
  insertSocial,
  insertTimelineItem,
  insertImageCarouselItem,
} from './slash-items';

const getCustomSlashMenuItems = (editor: CustomSchemaEditor): DefaultReactSuggestionItem[] => [
  insertProblemSectionItem(editor),
  insertTestimonialItem(editor),
  insertFeatureItem(editor),
  insertSolutionItem(editor),
  insertCallToActionItem(editor),
  insertTeamItem(editor),
  insertFaq(editor),
  insertSocial(editor),
  insertTimelineItem(editor),
  insertImageCarouselItem(editor),
  ...getDefaultReactSlashMenuItems(editor),
];

export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    customHeading: HeadlineBlockSpec,
    testimonial: testimonialBlockSpec,
    feature: featureBlockSpec,
    problem: problemBlockSpec,
    solution: solutionBlockSpec,
    callToAction: CallToActionBlockSpec,
    team: TeamBlockSpec,
    faq: FaqBlockSpec,
    social: SocialBlockSpec,
    timeline: TimelineBlockSpec,
    imageCarousel: ImageCarouselBlockSpec,
  },
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

export type CustomSchemaEditor = BlockNoteEditor<typeof customSchema.blockSchema>;
export type { PartialBlock } from '@blocknote/core';
export type { DefaultReactSuggestionItem } from '@blocknote/react';
export interface BlockNoteEditorProps {
  initialContent?: PartialBlock<typeof customSchema.blockSchema>[];
  onEditorReady: (editor: CustomSchemaEditor) => void;
}

export default function BlockNoteEditorComponent({ initialContent, onEditorReady }: BlockNoteEditorProps) {
  const editor: CustomSchemaEditor = useCreateBlockNote({
    schema: customSchema,
    initialContent: initialContent,
  });

  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return (
      <div className="p-4 border rounded-md min-h-[300px] flex items-center justify-center text-muted-foreground">
        Initializing Editor...
      </div>
    );
  }

  return (
    <BlockNoteView editor={editor} slashMenu={false} data-theming-css-variables-demo theme="light">
      <SuggestionMenuController
        triggerCharacter={'/'}
        getItems={async (query) => filterSuggestionItems(getCustomSlashMenuItems(editor), query)}
      />
    </BlockNoteView>
  );
}

export type { BlockNoteEditor, BlockNoteSchema };
