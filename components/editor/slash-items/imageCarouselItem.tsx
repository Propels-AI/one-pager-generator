import React from 'react';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import { Images } from 'lucide-react';
import type { CustomSchemaEditor, PartialBlock } from '../BlockNoteEditor';
import { imageCarouselBlockConfig } from '../blocks/ImageCarouselBlock';

export const insertImageCarouselItem = (editor: CustomSchemaEditor): DefaultReactSuggestionItem => ({
  title: 'Image Carousel',
  onItemClick: () => {
    const imageCarouselBlock: PartialBlock<typeof editor.schema.blockSchema> = {
      type: 'imageCarousel',
      props: {
        images: imageCarouselBlockConfig.propSchema.images.default,
        autoPlay: imageCarouselBlockConfig.propSchema.autoPlay.default,
        interval: imageCarouselBlockConfig.propSchema.interval.default,
        size: imageCarouselBlockConfig.propSchema.size.default,
      },
    };

    const insertedBlocks = editor.insertBlocks([imageCarouselBlock], editor.getTextCursorPosition().block, 'after');
    if (insertedBlocks.length > 0) {
      editor.setTextCursorPosition(insertedBlocks[0].id);
    }
  },
  aliases: ['carousel', 'gallery', 'slideshow', 'images', 'slider'],
  group: 'Custom Page Sections',
  icon: <Images size={18} />,
  subtext: 'Inserts an interactive image carousel with navigation.',
});
