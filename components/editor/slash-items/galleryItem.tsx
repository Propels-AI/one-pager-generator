import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { MdPhotoLibrary } from 'react-icons/md';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';

export const insertGalleryItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Image Gallery',
  onItemClick: () => {
    const galleryBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'gallery',
      props: {},
      // No content for 'none' content type blocks initially
    };
    editor.insertBlocks([galleryBlock], editor.getTextCursorPosition().block, 'after');
  },
  aliases: ['gallery', 'images', 'photos'],
  group: 'Custom Page Sections',
  icon: <MdPhotoLibrary size={18} />,
  subtext: 'Inserts an image gallery block.',
});
